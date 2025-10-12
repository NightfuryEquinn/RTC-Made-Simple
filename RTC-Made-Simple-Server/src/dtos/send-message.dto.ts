import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, IsString } from "class-validator";

export class SendMessageDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  senderName!: string

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  receiverName?: string | null

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  message!: string

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  roomName!: string

  @ApiProperty({ required: false })
  @IsOptional()
  metadata?: any

  constructor(dto: SendMessageDto) {
    Object.assign(this, dto)
  }
}
