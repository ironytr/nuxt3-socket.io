declare const _default: any;
export default _default;
declare module '#app' {
    interface NuxtApp {
        $io: typeof import('socket.io-client')['io'];
        $socket: ReturnType<typeof import('socket.io-client')['io']>;
    }
}
