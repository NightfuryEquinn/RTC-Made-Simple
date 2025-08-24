import { ApiProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";

export class ResponseCallDto {
  @ApiProperty()
  @IsString()
  callId!: string

  @ApiProperty()
  @IsString()
  callerId!: string

  @ApiProperty()
  @IsString()
  receiverId!: string

  constructor(dto: ResponseCallDto) {
    Object.assign(this, dto)
  }
}