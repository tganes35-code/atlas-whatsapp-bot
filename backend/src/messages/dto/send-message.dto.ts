import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class ProcessMessageDto {
  @ApiProperty({ example: '3001234567' })
  @IsString()
  phone: string;

  @ApiProperty({ example: 'Hola, quiero ver camisetas' })
  @IsString()
  message: string;

  @ApiPropertyOptional({ default: 'LOCAL' })
  @IsOptional()
  @IsString()
  channel?: string;
}
