import { Server as SocketServer, ServerOptions } from 'socket.io';
declare global {
    var __io: SocketServer;
}
export declare function createIOHandler<T extends Record<string, (io: SocketServer) => void>>(functions: T, serverOptions: Partial<ServerOptions>): import("h3").EventHandler<void>;
