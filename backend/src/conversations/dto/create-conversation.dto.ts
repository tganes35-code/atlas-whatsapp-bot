import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ConversationChannel } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class CreateConversationDto {
  @ApiProperty()
  @IsString()
  customerId: string;

  @ApiPropertyOptional({ enum: ConversationChannel, default: 'LOCAL' })
  @IsOptional()
  @IsEnum(ConversationChannel)
  channel?: ConversationChannel;
}

export class AssignAgentDto {
  @ApiProperty()
  @IsString()
  userId: string;
}

export class SendMessageDto {
  @ApiProperty()
  @IsString()
  content: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  type?: string;
}
