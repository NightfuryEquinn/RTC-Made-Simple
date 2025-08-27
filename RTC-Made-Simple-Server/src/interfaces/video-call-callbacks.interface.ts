import { CallStatus } from "../dtos/end-call.dto";

export interface VideoCallCallbacks {
  onCallCreated?: (callerName: string, receiverName: string) => Promise<void>,
  onCallEnded?: (callerName: string, receiverName: string, status: CallStatus) => Promise<void>
}