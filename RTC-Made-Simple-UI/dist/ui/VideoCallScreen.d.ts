import React from "react";
import { Constraints } from "react-native-webrtc/lib/typescript/getUserMedia";
interface VideoCallScreenProps {
    currentUser: string;
    conversationId: number;
    receiverName: string;
    callerName: string;
    onCallEnd: (duration: string) => void;
    iceServers?: RTCIceServer[];
    mediaConstraints?: Constraints;
    avatarUrl?: string;
    localAvatarUrl?: string;
}
export declare const VideoCallScreen: React.FC<VideoCallScreenProps>;
export {};
//# sourceMappingURL=VideoCallScreen.d.ts.map