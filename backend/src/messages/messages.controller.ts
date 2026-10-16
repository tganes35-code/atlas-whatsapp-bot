import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { MessagesService } from './messages.service';
import { ProcessMessageDto } from './dto/send-message.dto';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('messages')
@Controller('messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Post('process')
  @Public()
  @ApiOperation({
    summary: 'Procesar un mensaje entrante (simulador / local / webhook)',
    description:
      'Punto de entrada principal del chatbot. Recibe mensaje, procesa con IA y devuelve respuesta.',
  })
  process(@Body() dto: ProcessMessageDto) {
    return this.messagesService.processIncomingMessage(dto);
  }
}
