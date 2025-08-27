import { create } from "zustand"
import { IncomingCallData } from "../types/call.types"

type CallOverlayState = {
  incomingCall: IncomingCallData | null
  isCallVisible: boolean
  setIncomingCall: (data: IncomingCallData | null) => void
  setIsCallVisible: (visible: boolean) => void
  reset: () => void
}

export const useCallOverlay = create<CallOverlayState>((set) => ({
  incomingCall: null,
  isCallVisible: false,
  setIncomingCall: (data) => set({ incomingCall: data }),
  setIsCallVisible: (visible) => set({ isCallVisible: visible }),
  reset: () => set({ incomingCall: null, isCallVisible: false }),
}))