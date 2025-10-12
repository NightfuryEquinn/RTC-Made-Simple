import { ApiProperty } from "@nestjs/swagger";

export class MessageResponseDto {
  @ApiProperty()
  messageId!: string

  @ApiProperty()
  senderName!: string

  @ApiProperty({ required: false })
  receiverName?: string | null

  @ApiProperty()
  message!: string

  @ApiProperty()
  roomName!: string

  @ApiProperty()
  timestamp!: string

  @ApiProperty({ required: false })
  metadata?: any

  constructor(partial: Partial<MessageResponseDto>) {
    Object.assign(this, partial)
  }
}
