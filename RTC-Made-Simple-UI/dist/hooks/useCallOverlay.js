"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useCallOverlay = void 0;
const zustand_1 = require("zustand");
exports.useCallOverlay = (0, zustand_1.create)((set) => ({
    incomingCall: null,
    isCallVisible: false,
    setIncomingCall: (data) => set({ incomingCall: data }),
    setIsCallVisible: (visible) => set({ isCallVisible: visible }),
    reset: () => set({ incomingCall: null, isCallVisible: false }),
}));
//# sourceMappingURL=useCallOverlay.js.map