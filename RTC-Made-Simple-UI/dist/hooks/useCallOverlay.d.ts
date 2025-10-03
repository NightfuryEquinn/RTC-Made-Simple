import { IncomingCallData } from "../types/call.types";
type CallOverlayState = {
    incomingCall: IncomingCallData | null;
    isCallVisible: boolean;
    setIncomingCall: (data: IncomingCallData | null) => void;
    setIsCallVisible: (visible: boolean) => void;
    reset: () => void;
};
export declare const useCallOverlay: import("zustand").UseBoundStore<import("zustand").StoreApi<CallOverlayState>>;
export {};
//# sourceMappingURL=useCallOverlay.d.ts.map