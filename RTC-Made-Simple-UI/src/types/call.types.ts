export interface IncomingCallData {
  callerName: string
  receiverName: string
  conversationId: number
}

export interface CallDeclinedData {
  callerName: string
  receiverName: string
  reason: string
}

export interface CallAcceptedData {
  callerName: string
  receiverName: string
  conversationId: number
}

export interface CallEndedData {
  callerName: string
  receiverName: string
  conversationId: number
  endedBy: string
}

export interface VideoCallConfig {
  baseUrl: string
  iceServers?: RTCIceServer[]
  mediaConstraints?: MediaStreamConstraints
}