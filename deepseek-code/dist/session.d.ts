import { Session, ChatMessage } from './types';
export type { Session };
export declare function createSession(): Session;
export declare function saveSession(session: Session): void;
export declare function loadSession(id: string): Session | null;
export declare function listSessions(): Array<{
    id: string;
    createdAt: string;
    messageCount: number;
}>;
export declare function loadLatestSession(): Session | null;
export declare function addToSession(session: Session, message: ChatMessage): Session;
export declare function clearSessionMessages(session: Session): Session;
export declare function trimSessionContext(session: Session, maxMessages?: number): Session;
//# sourceMappingURL=session.d.ts.map