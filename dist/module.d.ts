import * as _nuxt_schema from '@nuxt/schema';
import { ServerOptions, Server } from 'socket.io';

interface ModuleOptions {
    addPlugin: boolean;
    serverOptions: Partial<ServerOptions>;
}
declare function defineIOHandler(cb: (io: Server) => void): (io: Server) => void;
declare const _default: _nuxt_schema.NuxtModule<ModuleOptions>;

export { ModuleOptions, _default as default, defineIOHandler };
