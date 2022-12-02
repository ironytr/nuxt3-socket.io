import type { Server } from 'http'
import { Server as SocketServer, ServerOptions } from 'socket.io'
import { eventHandler } from 'h3'

export function createIOHandler<T extends Record<string, (io: SocketServer) => void>> (functions: T, serverOptions: Partial<ServerOptions>) {
  return eventHandler((event) => {
    // @ts-ignore
    if (!event.node.req.$io) {
      const httpServer = (event.node.req.socket as any).server as Server
      const io = new SocketServer(httpServer, serverOptions)

      Object.keys(functions).forEach((fn) => {
        functions[fn](io)
      })

      // @ts-ignore
      event.node.req.$io = io
    }

    return {
      ok: true
    }
  })
}
