import { Socket } from "socket.io-client";
export declare const createVideoSocket: (callerName: string, baseUrl: string) => Socket;
export declare const getVideoSocket: () => Socket | null;
export declare const disconnectVideoSocket: () => void;
export declare const createChatSocket: (userName: string, roomName: string, baseUrl: string) => Socket;
export declare const getChatSocket: () => Socket | null;
export declare const disconnectChatSocket: () => void;
//# sourceMappingURL=socket.d.ts.map