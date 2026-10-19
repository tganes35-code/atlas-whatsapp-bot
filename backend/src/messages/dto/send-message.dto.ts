import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ConversationChannel } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class ProcessMessageDto {
  @ApiProperty({ example: '3001234567' })
  @IsString()
  phone: string;

  @ApiProperty({ example: 'Hola, quiero ver camisetas' })
  @IsString()
  message: string;

  @ApiPropertyOptional({
    enum: ConversationChannel,
    default: ConversationChannel.WHATSAPP,
  })
  @IsOptional()
  @IsEnum(ConversationChannel)
  channel?: ConversationChannel;
}
