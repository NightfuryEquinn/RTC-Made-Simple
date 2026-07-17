import { CallStatus } from "../dtos/end-call.dto";

export interface VideoCallCallbacks {
  onCallCreated?: (
    callerName: string,
    receiverName: string,
    conversationId?: number
  ) => Promise<void>;
  onCallEnded?: (
    callerName: string,
    receiverName: string,
    status: CallStatus
  ) => Promise<void>;
  /**
   * Optional connection gate. Return false to reject the socket handshake.
   * Authentication is not built-in; host apps should implement this.
   */
  canConnect?: (
    callerName: string,
    roomName: string | undefined,
    handshake: Record<string, unknown>
  ) => Promise<boolean> | boolean;
}
