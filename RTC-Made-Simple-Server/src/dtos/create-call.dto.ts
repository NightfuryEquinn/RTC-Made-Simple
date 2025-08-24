import { ApiProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";

export class CreateCallDto {
  @ApiProperty()
  @IsString()
  callerId!: string

  @ApiProperty()
  @IsString()
  receiverId!: string

  constructor(dto: CreateCallDto) {
    Object.assign(this, dto)
  }
}