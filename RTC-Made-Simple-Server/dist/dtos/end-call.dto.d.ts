export declare enum CallStatus {
    PENDING = "Pending",
    ACCEPTED = "Accepted",
    REJECTED = "Rejected",
    ENDED = "Ended"
}
export declare class EndCallDto {
    callerId: string;
    receiverId: string;
    status: CallStatus;
    constructor(dto: EndCallDto);
}
//# sourceMappingURL=end-call.dto.d.ts.map