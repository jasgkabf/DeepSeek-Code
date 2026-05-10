import * as http from 'http';
import express from 'express';
import { WebSocketServer, WebSocket } from 'ws';
import { DeepSeekCodeConfig, ChatMessage } from '../types';
import { runAgent } from '../agent';
import { createSession, loadLatestSession, addToSession, trimSessionContext, saveSession, Session } from '../session';
import { flushAudit } from '../telemetry';
import { getFrontendHTML } from './frontend';

const DEFAULT_PORT = 3231;

interface ConnectedClient {
  ws: WebSocket;
  session: Session;
  config: DeepSeekCodeConfig;
}

export async function startWebServer(config: DeepSeekCodeConfig, port?: number): Promise<void> {
  const actualPort = port || DEFAULT_PORT;
  const app = express();
  app.use(express.json());

  const server = http.createServer(app);

  const wss = new WebSocketServer({ server });

  const clients = new Map<string, ConnectedClient>();

  app.get('/', (_req: express.Request, res: express.Response) => {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(getFrontendHTML(config));
  });

  wss.on('connection', async (ws, req) => {
    console.log('[Web] Client connected from', req.socket.remoteAddress);
    const clientId = Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
    const session = (await loadLatestSession()) || createSession();

    const client: ConnectedClient = { ws, session, config };
    clients.set(clientId, client);

    send(ws, {
      type: 'init',
      data: {
        sessionId: session.id,
        model: config.model,
        provider: config.provider,
        messages: session.messages.filter((m) => m.role !== 'system'),
      },
    });

    ws.on('message', async (raw) => {
      try {
        const msg = JSON.parse(raw.toString());
        console.log('[Web] Received:', msg.type);
        await handleMessage(clientId, client, msg);
      } catch (err: any) {
        console.error('[Web] Error:', err.message);
        send(ws, { type: 'error', data: { message: err.message } });
      }
    });

    ws.on('close', async () => {
      console.log('[Web] Client disconnected');
      await saveSession(client.session);
      flushAudit();
      clients.delete(clientId);
    });

    ws.on('error', (err) => {
      console.error('[Web] WebSocket error:', err.message);
    });
  });

  server.listen(actualPort, '0.0.0.0', () => {
    console.log(`\n  DeepSeek Code Web UI`);
    console.log(`  -------------------------`);
    console.log(`  Local:    http://localhost:${actualPort}`);
    console.log(`  Network:  http://0.0.0.0:${actualPort}`);
    console.log(`  Model:    ${config.model}`);
    console.log(`  Press Ctrl+C to stop\n`);
  });
}

function send(ws: WebSocket, data: any): void {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(data));
  }
}

async function handleMessage(clientId: string, client: ConnectedClient, msg: any): Promise<void> {
  const { ws, config } = client;

  switch (msg.type) {
    case 'chat': {
      const input = msg.data?.message || '';
      if (!input.trim()) return;

      const userMessage: ChatMessage = { role: 'user', content: input };
      client.session = await addToSession(client.session, userMessage);
      client.session = await trimSessionContext(client.session, config.maxContextTokens);

      send(ws, { type: 'user_message', data: { content: input } });
      send(ws, { type: 'agent_start', data: {} });

      try {
        const newMessages = await runAgent({
          config,
          messages: client.session.messages,
          onContent: (text: string) => {
            send(ws, { type: 'agent_text', data: { text } });
          },
          onToolCall: (name: string, args: string) => {
            send(ws, { type: 'tool_call', data: { name, args } });
          },
          onToolResult: (name: string, result: string, isError: boolean) => {
            send(ws, { type: 'tool_result', data: { name, result: result.substring(0, 3000), isError } });
            if (name === 'run_command') {
              send(ws, { type: 'terminal_output', data: { output: result, isError } });
            }
          },
        });

        for (const m of newMessages) {
          client.session = await addToSession(client.session, m);
        }

        send(ws, { type: 'agent_done', data: {} });
      } catch (err: any) {
        send(ws, { type: 'agent_error', data: { message: err.message } });
      }

      await saveSession(client.session);
      break;
    }

    case 'command': {
      const cmd = msg.data?.command || '';
      if (cmd === '/new') {
        await saveSession(client.session);
        client.session = createSession();
        send(ws, { type: 'system', data: { message: 'New session created' } });
      } else if (cmd === '/clear') {
        client.session.messages = client.session.messages.filter((m) => m.role === 'system');
        await saveSession(client.session);
        send(ws, { type: 'system', data: { message: 'Session cleared' } });
      }
      break;
    }

    default:
      break;
  }
}
