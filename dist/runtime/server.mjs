import { Server as SocketServer } from "socket.io";
import { eventHandler } from "h3";
export function createIOHandler(functions, serverOptions) {
  return eventHandler((event) => {
    if (!globalThis.__io && process.env.NODE_ENV === "production") {
      const httpServer = event.node.req.socket.server;
      const io = new SocketServer(httpServer, serverOptions);
      Object.keys(functions).forEach((fn) => {
        functions[fn](io);
      });
      globalThis.__io = io;
    }
  });
}
