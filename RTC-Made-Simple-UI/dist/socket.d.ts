import { Socket } from "socket.io-client";
export declare const createVideoSocket: (callerName: string, baseUrl: string) => Socket<import("@socket.io/component-emitter").DefaultEventsMap, import("@socket.io/component-emitter").DefaultEventsMap>;
export declare const getVideoSocket: () => Socket | null;
export declare const disconnectVideoSocket: () => void;
//# sourceMappingURL=socket.d.ts.map