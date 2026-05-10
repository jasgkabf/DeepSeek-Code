import { DeepSeekCodeConfig } from '../types';

export function getFrontendHTML(config: DeepSeekCodeConfig): string {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<title>DeepSeek Code</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
:root{
  --bg:#0a0a0f;--bg2:#12121a;--bg3:#1a1a28;--bg4:#222236;
  --border:#2a2a40;--text:#e0e0f0;--text2:#8888aa;--text3:#555570;
  --accent:#6c5ce7;--accent2:#a29bfe;--green:#00d68f;--red:#ff6b6b;
  --yellow:#ffd93d;--blue:#4ecdc4;--orange:#ff9f43;
  --radius:12px;--radius-sm:8px;
}
html,body{height:100%;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:var(--bg);color:var(--text);overflow:hidden}
.app{display:flex;flex-direction:column;height:100vh;width:100vw}

.header{display:flex;align-items:center;justify-content:space-between;padding:10px 16px;background:var(--bg2);border-bottom:1px solid var(--border);flex-shrink:0;gap:8px}
.header-left{display:flex;align-items:center;gap:10px;min-width:0}
.logo{font-size:18px;font-weight:700;background:linear-gradient(135deg,var(--accent),var(--accent2));-webkit-background-clip:text;-webkit-text-fill-color:transparent;white-space:nowrap}
.model-badge{font-size:11px;padding:3px 8px;background:var(--bg4);border-radius:20px;color:var(--text2);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:150px}
.header-right{display:flex;align-items:center;gap:8px}
.btn-icon{width:34px;height:34px;border:none;background:var(--bg4);color:var(--text2);border-radius:var(--radius-sm);cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:16px;transition:all .2s}
.btn-icon:hover{background:var(--accent);color:#fff}

.main{display:flex;flex:1;overflow:hidden;position:relative}

.sidebar{width:240px;background:var(--bg2);border-right:1px solid var(--border);display:flex;flex-direction:column;overflow:hidden;flex-shrink:0;transition:transform .3s}
.sidebar-header{padding:12px;font-size:13px;font-weight:600;color:var(--text2);border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center}
.file-tree{flex:1;overflow-y:auto;padding:4px 0}
.file-item{padding:5px 12px 5px 24px;font-size:12px;color:var(--text2);cursor:pointer;display:flex;align-items:center;gap:6px;transition:background .15s;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.file-item:hover{background:var(--bg4);color:var(--text)}
.file-item.active{background:var(--accent);color:#fff}
.file-icon{font-size:13px;flex-shrink:0}

.chat-area{flex:1;display:flex;flex-direction:column;min-width:0}
.messages{flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:12px;scroll-behavior:smooth}
.msg{max-width:85%;animation:fadeIn .3s ease}
.msg-user{align-self:flex-end}
.msg-ai{align-self:flex-start}
.msg-bubble{padding:12px 16px;border-radius:var(--radius);line-height:1.6;font-size:14px;word-break:break-word;white-space:pre-wrap}
.msg-user .msg-bubble{background:var(--accent);color:#fff;border-bottom-right-radius:4px}
.msg-ai .msg-bubble{background:var(--bg3);color:var(--text);border-bottom-left-radius:4px}
.msg-time{font-size:10px;color:var(--text3);margin-top:4px;padding:0 4px}
.msg-user .msg-time{text-align:right}

.tool-card{background:var(--bg2);border:1px solid var(--border);border-radius:var(--radius-sm);margin:8px 0;overflow:hidden;animation:fadeIn .3s ease}
.tool-header{display:flex;align-items:center;gap:8px;padding:8px 12px;background:var(--bg4);font-size:12px;cursor:pointer}
.tool-header:hover{background:var(--border)}
.tool-icon{font-size:14px}
.tool-name{font-weight:600;color:var(--accent2)}
.tool-status{margin-left:auto;font-size:11px;padding:2px 8px;border-radius:10px}
.tool-status.running{background:var(--yellow);color:#000}
.tool-status.success{background:var(--green);color:#000}
.tool-status.error{background:var(--red);color:#fff}
.tool-body{padding:10px 12px;font-size:12px;font-family:'SF Mono',Monaco,Consolas,monospace;color:var(--text2);max-height:300px;overflow-y:auto;white-space:pre-wrap;word-break:break-all;line-height:1.5}
.tool-args{color:var(--text3);border-bottom:1px solid var(--border);padding:8px 12px;font-size:11px;font-family:monospace;white-space:pre-wrap;word-break:break-all}

.terminal-panel{height:200px;background:var(--bg);border-top:1px solid var(--border);display:flex;flex-direction:column;flex-shrink:0;transition:height .3s}
.terminal-panel.collapsed{height:36px}
.terminal-header{display:flex;align-items:center;gap:8px;padding:6px 12px;background:var(--bg2);border-bottom:1px solid var(--border);cursor:pointer;flex-shrink:0}
.terminal-title{font-size:12px;font-weight:600;color:var(--text2)}
.terminal-dot{width:8px;height:8px;border-radius:50%;background:var(--green);animation:pulse 2s infinite}
.terminal-body{flex:1;overflow-y:auto;padding:8px 12px;font-family:'SF Mono',Monaco,Consolas,monospace;font-size:12px;line-height:1.6;color:var(--text2)}
.term-line{margin:1px 0}
.term-cmd{color:var(--green)}
.term-stdout{color:var(--text2)}
.term-stderr{color:var(--orange)}
.term-exit{color:var(--text3);font-style:italic}

.input-area{padding:12px 16px;background:var(--bg2);border-top:1px solid var(--border);flex-shrink:0}
.input-wrap{display:flex;gap:8px;align-items:flex-end}
.input-field{flex:1;background:var(--bg3);border:1px solid var(--border);border-radius:var(--radius);padding:10px 14px;color:var(--text);font-size:14px;resize:none;outline:none;min-height:42px;max-height:120px;font-family:inherit;line-height:1.5;transition:border-color .2s}
.input-field:focus{border-color:var(--accent)}
.input-field::placeholder{color:var(--text3)}
.send-btn{width:42px;height:42px;border:none;background:var(--accent);color:#fff;border-radius:var(--radius-sm);cursor:pointer;font-size:18px;display:flex;align-items:center;justify-content:center;transition:all .2s;flex-shrink:0}
.send-btn:hover{background:var(--accent2);transform:scale(1.05)}
.send-btn:disabled{opacity:.4;cursor:not-allowed;transform:none}

.typing{display:inline-flex;gap:4px;padding:8px 0}
.typing span{width:6px;height:6px;background:var(--accent);border-radius:50%;animation:typing 1.4s infinite}
.typing span:nth-child(2){animation-delay:.2s}
.typing span:nth-child(3){animation-delay:.4s}

@keyframes typing{0%,60%,100%{transform:translateY(0);opacity:.4}30%{transform:translateY(-8px);opacity:1}}
@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}

::-webkit-scrollbar{width:6px}
::-webkit-scrollbar-track{background:transparent}
::-webkit-scrollbar-thumb{background:var(--border);border-radius:3px}
::-webkit-scrollbar-thumb:hover{background:var(--text3)}

@media(max-width:768px){
  .sidebar{position:fixed;left:0;top:0;bottom:0;z-index:100;transform:translateX(-100%);width:280px}
  .sidebar.open{transform:translateX(0)}
  .sidebar-overlay{display:none;position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:99}
  .sidebar-overlay.open{display:block}
  .msg{max-width:95%}
  .terminal-panel{height:150px}
  .header{padding:8px 12px}
  .logo{font-size:15px}
  .input-area{padding:8px 12px}
}
</style>
</head>
<body>
<div class="app">
  <div class="header">
    <div class="header-left">
      <button class="btn-icon" id="menuBtn" onclick="toggleSidebar()">☰</button>
      <span class="logo">⚡ DeepSeek Code</span>
      <span class="model-badge" id="modelBadge">${config.model}</span>
    </div>
    <div class="header-right">
      <button class="btn-icon" onclick="newChat()" title="新会话">✨</button>
      <button class="btn-icon" onclick="clearChat()" title="清空">🗑</button>
    </div>
  </div>

  <div class="sidebar-overlay" id="sidebarOverlay" onclick="toggleSidebar()"></div>

  <div class="main">
    <div class="sidebar" id="sidebar">
      <div class="sidebar-header">
        <span>📁 项目文件</span>
        <button class="btn-icon" style="width:26px;height:26px;font-size:12px" onclick="toggleSidebar()">✕</button>
      </div>
      <div class="file-tree" id="fileTree">
        <div class="file-item" style="color:var(--text3)">连接中...</div>
      </div>
    </div>

    <div class="chat-area">
      <div class="messages" id="messages"></div>

      <div class="terminal-panel" id="terminalPanel">
        <div class="terminal-header" onclick="toggleTerminal()">
          <span class="terminal-dot" id="termDot"></span>
          <span class="terminal-title">终端输出</span>
          <span style="margin-left:auto;font-size:11px;color:var(--text3)" id="termToggle">▼</span>
        </div>
        <div class="terminal-body" id="termBody"></div>
      </div>

      <div class="input-area">
        <div class="input-wrap">
          <textarea class="input-field" id="inputField" placeholder="输入消息，按 Enter 发送，Shift+Enter 换行..." rows="1"></textarea>
          <button class="send-btn" id="sendBtn" onclick="sendMessage()">➤</button>
        </div>
      </div>
    </div>
  </div>
</div>

<script>
let ws=null;
let isAgentRunning=false;
let reconnectTimer=null;

function connect(){
  const proto=location.protocol==='https:'?'wss':'ws';
  ws=new WebSocket(proto+'://'+location.host+'/ws');

  ws.onopen=()=>{
    addSystemMsg('已连接到 DeepSeek Code 服务器');
    if(reconnectTimer){clearInterval(reconnectTimer);reconnectTimer=null}
  };

  ws.onmessage=(e)=>{
    const msg=JSON.parse(e.data);
    handleServerMessage(msg);
  };

  ws.onclose=()=>{
    addSystemMsg('连接已断开，5秒后重连...');
    if(!reconnectTimer){
      reconnectTimer=setInterval(()=>{
        if(ws&&ws.readyState===WebSocket.CLOSED) connect();
      },5000);
    }
  };

  ws.onerror=()=>{};
}

function handleServerMessage(msg){
  switch(msg.type){
    case 'init':
      document.getElementById('modelBadge').textContent=msg.data.model||'';
      if(msg.data.messages){
        msg.data.messages.forEach(m=>{
          if(m.role==='user') addUserBubble(m.content,false);
          else if(m.role==='assistant'&&m.content) addAIBubble(m.content,false);
        });
      }
      break;
    case 'user_message':
      addUserBubble(msg.data.content);
      break;
    case 'agent_start':
      isAgentRunning=true;
      updateSendBtn();
      addTypingIndicator();
      break;
    case 'agent_text':
      removeTypingIndicator();
      appendAIText(msg.data.text);
      break;
    case 'agent_done':
      isAgentRunning=false;
      updateSendBtn();
      removeTypingIndicator();
      finalizeAIMsg();
      break;
    case 'agent_error':
      isAgentRunning=false;
      updateSendBtn();
      removeTypingIndicator();
      addSystemMsg('❌ '+msg.data.message);
      break;
    case 'tool_call':
      addToolCard(msg.data);
      break;
    case 'tool_result':
      updateToolCard(msg.data);
      break;
    case 'terminal_output':
      addTerminalLine(msg.data.output);
      break;
    case 'system':
      addSystemMsg(msg.data.message);
      break;
    case 'error':
      addSystemMsg('❌ '+msg.data.message);
      break;
  }
}

function addUserBubble(text,animate=true){
  const d=document.getElementById('messages');
  const div=document.createElement('div');
  div.className='msg msg-user'+(animate?'':'');
  if(!animate) div.style.animation='none';
  const now=new Date().toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit'});
  div.innerHTML='<div class="msg-bubble">'+escHtml(text)+'</div><div class="msg-time">'+now+'</div>';
  d.appendChild(div);
  scrollToBottom();
}

let currentAIMsg=null;
let currentAIText='';

function addAIBubble(text,animate=true){
  const d=document.getElementById('messages');
  const div=document.createElement('div');
  div.className='msg msg-ai';
  if(!animate) div.style.animation='none';
  const now=new Date().toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit'});
  div.innerHTML='<div class="msg-bubble"></div><div class="msg-time">'+now+'</div>';
  d.appendChild(div);
  currentAIMsg=div.querySelector('.msg-bubble');
  currentAIText='';
  appendAIText(text);
  scrollToBottom();
}

function appendAIText(text){
  if(!currentAIMsg){
    addAIBubble(text);
    return;
  }
  currentAIText+=text;
  currentAIMsg.innerHTML=renderMarkdown(currentAIText);
  scrollToBottom();
}

function finalizeAIMsg(){
  currentAIMsg=null;
  currentAIText='';
}

function addSystemMsg(text){
  const d=document.getElementById('messages');
  const div=document.createElement('div');
  div.style.cssText='text-align:center;padding:8px;font-size:12px;color:var(--text3);animation:fadeIn .3s ease';
  div.textContent=text;
  d.appendChild(div);
  scrollToBottom();
}

function addTypingIndicator(){
  removeTypingIndicator();
  const d=document.getElementById('messages');
  const div=document.createElement('div');
  div.className='msg msg-ai';
  div.id='typingIndicator';
  div.innerHTML='<div class="msg-bubble"><div class="typing"><span></span><span></span><span></span></div></div>';
  d.appendChild(div);
  scrollToBottom();
}

function removeTypingIndicator(){
  const el=document.getElementById('typingIndicator');
  if(el) el.remove();
}

let toolCardCounter=0;
function addToolCard(data){
  removeTypingIndicator();
  const d=document.getElementById('messages');
  const id='tool-'+(++toolCardCounter);
  const div=document.createElement('div');
  div.className='tool-card';
  div.id=id;
  const icon=getToolIcon(data.name);
  const argsPreview=truncateArgs(data.args);
  div.innerHTML=
    '<div class="tool-header" onclick="toggleToolBody(\\''+id+'\\')">'+
      '<span class="tool-icon">'+icon+'</span>'+
      '<span class="tool-name">'+escHtml(data.name)+'</span>'+
      '<span class="tool-status running">运行中</span>'+
    '</div>'+
    (argsPreview?'<div class="tool-args">'+escHtml(argsPreview)+'</div>':'')+
    '<div class="tool-body" style="display:none">等待结果...</div>';
  d.appendChild(div);
  scrollToBottom();

  if(data.name==='run_command'){
    const cmd=tryParseArgs(data.args)?.command||data.args;
    addTerminalLine('$ '+cmd,'cmd');
  }
}

function updateToolCard(data){
  const cards=document.querySelectorAll('.tool-card');
  const last=cards[cards.length-1];
  if(!last) return;
  const status=last.querySelector('.tool-status');
  const body=last.querySelector('.tool-body');
  if(status){
    status.className='tool-status '+(data.isError?'error':'success');
    status.textContent=data.isError?'失败':'完成';
  }
  if(body){
    body.textContent=truncate(data.result,2000);
    body.style.display='block';
  }

  if(data.name==='run_command'){
    const lines=data.result.split('\\n');
    lines.forEach(line=>{
      if(data.isError) addTerminalLine(line,'stderr');
      else addTerminalLine(line,'stdout');
    });
    addTerminalLine('[exit '+(data.isError?'1':'0')+']','exit');
  }
}

function toggleToolBody(id){
  const body=document.querySelector('#'+id+' .tool-body');
  if(body) body.style.display=body.style.display==='none'?'block':'none';
}

function addTerminalLine(text,type='stdout'){
  const body=document.getElementById('termBody');
  const line=document.createElement('div');
  line.className='term-line term-'+type;
  line.textContent=text;
  body.appendChild(line);
  body.scrollTop=body.scrollHeight;

  const dot=document.getElementById('termDot');
  if(type==='cmd') dot.style.background='var(--yellow)';
  else if(type==='stderr') dot.style.background='var(--red)';
  else dot.style.background='var(--green)';
}

function getToolIcon(name){
  const icons={
    read_file:'📄',write_file:'✏️',append_file:'📝',edit_file:'🔧',
    list_directory:'📁',run_command:'⚡',copy_to_clipboard:'📋'
  };
  return icons[name]||'🔧';
}

function truncateArgs(argsStr){
  try{
    const a=JSON.parse(argsStr);
    if(a.command) return '$ '+a.command;
    if(a.path) return a.path+(a.content?' ('+a.content.length+' chars)':'');
    return JSON.stringify(a).substring(0,120);
  }catch{
    return (argsStr||'').substring(0,120);
  }
}

function tryParseArgs(s){
  try{return JSON.parse(s)}catch{return null}
}

function truncate(s,n){
  if(!s) return '';
  return s.length>n?s.substring(0,n)+'...':s;
}

function escHtml(s){
  const d=document.createElement('div');
  d.textContent=s;
  return d.innerHTML;
}

function renderMarkdown(text){
  let html=escHtml(text);
  html=html.replace(/\`\`\`(\\w*)\\n([\\s\\S]*?)\`\`\`/g,'<pre style="background:var(--bg);padding:10px;border-radius:6px;overflow-x:auto;margin:6px 0;font-size:12px"><code>$2</code></pre>');
  html=html.replace(/\`([^\`]+)\`/g,'<code style="background:var(--bg4);padding:1px 4px;border-radius:3px;font-size:12px">$1</code>');
  html=html.replace(/\\*\\*(.+?)\\*\\*/g,'<strong>$1</strong>');
  return html;
}

function scrollToBottom(){
  const d=document.getElementById('messages');
  setTimeout(()=>d.scrollTop=d.scrollHeight,50);
}

function sendMessage(){
  const field=document.getElementById('inputField');
  const text=field.value.trim();
  if(!text||isAgentRunning) return;
  ws.send(JSON.stringify({type:'chat',data:{message:text}}));
  field.value='';
  field.style.height='auto';
}

function newChat(){
  if(ws&&ws.readyState===WebSocket.OPEN){
    ws.send(JSON.stringify({type:'command',data:{command:'/new'}}));
    document.getElementById('messages').innerHTML='';
    document.getElementById('termBody').innerHTML='';
    addSystemMsg('已创建新会话');
  }
}

function clearChat(){
  if(ws&&ws.readyState===WebSocket.OPEN){
    ws.send(JSON.stringify({type:'command',data:{command:'/clear'}}));
    document.getElementById('messages').innerHTML='';
    addSystemMsg('会话已清空');
  }
}

function updateSendBtn(){
  document.getElementById('sendBtn').disabled=isAgentRunning;
}

function toggleSidebar(){
  const s=document.getElementById('sidebar');
  const o=document.getElementById('sidebarOverlay');
  s.classList.toggle('open');
  o.classList.toggle('open');
}

function toggleTerminal(){
  const p=document.getElementById('terminalPanel');
  p.classList.toggle('collapsed');
  const t=document.getElementById('termToggle');
  t.textContent=p.classList.contains('collapsed')?'▲':'▼';
}

document.getElementById('inputField').addEventListener('keydown',(e)=>{
  if(e.key==='Enter'&&!e.shiftKey){
    e.preventDefault();
    sendMessage();
  }
});

document.getElementById('inputField').addEventListener('input',function(){
  this.style.height='auto';
  this.style.height=Math.min(this.scrollHeight,120)+'px';
});

connect();
</script>
</body>
</html>`;
}
