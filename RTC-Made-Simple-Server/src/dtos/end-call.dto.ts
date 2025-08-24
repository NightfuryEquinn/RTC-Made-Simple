import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsString } from "class-validator";

export enum CallStatus {
  PENDING = 'Pending',
  ACCEPTED = 'Accepted',
  REJECTED = 'Rejected',
  ENDED = 'Ended'
}

export class EndCallDto {
  @ApiProperty()
  @IsString()
  callerId!: string

  @ApiProperty()
  @IsString()
  receiverId!: string

  @ApiProperty()
  @IsEnum(CallStatus)
  status!: CallStatus

  constructor(dto: EndCallDto) {
    Object.assign(this, dto)
  }
}