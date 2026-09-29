import { Body, Controller, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { MessagesService } from './messages.service';
import { ProcessMessageDto } from './dto/send-message.dto';

@ApiTags('messages')
@ApiBearerAuth()
@Controller('messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Post('process')
  @ApiOperation({
    summary: 'Procesar un mensaje entrante (simulador / local)',
    description:
      'Punto de entrada principal del chatbot. Recibe mensaje, procesa con IA y devuelve respuesta.',
  })
  process(@Body() dto: ProcessMessageDto) {
    return this.messagesService.processIncomingMessage(dto);
  }
}
