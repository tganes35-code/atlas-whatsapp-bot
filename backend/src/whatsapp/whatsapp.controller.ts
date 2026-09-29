import {
  Body, Controller, Get, HttpCode, Logger, Post, Query, Res,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { WhatsappService } from './whatsapp.service';
import { MessagesService } from '../messages/messages.service';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('whatsapp')
@Controller('webhooks/whatsapp')
export class WhatsappController {
  private readonly logger = new Logger(WhatsappController.name);

  constructor(
    private readonly whatsappService: WhatsappService,
    private readonly messagesService: MessagesService,
  ) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Verificación de webhook Meta' })
  verifyWebhook(
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') token: string,
    @Query('hub.challenge') challenge: string,
    @Res() res: Response,
  ) {
    const result = this.whatsappService.verifyWebhook(mode, token, challenge);
    if (result) {
      res.status(200).send(result);
    } else {
      res.status(403).send('Forbidden');
    }
  }

  @Public()
  @Post()
  @HttpCode(200)
  @ApiOperation({ summary: 'Recibir mensajes de WhatsApp' })
  async receiveMessage(@Body() body: any) {
    const parsed = this.whatsappService.parseWebhookMessage(body);

    if (!parsed) {
      return { status: 'ok' };
    }

    try {
      const result = await this.messagesService.processIncomingMessage({
        phone: parsed.phone,
        message: parsed.message,
        channel: 'WHATSAPP',
      });

      if (!result.humanMode && result.botResponse) {
        await this.whatsappService.sendTextMessage(parsed.phone, result.botResponse);
      }
    } catch (error: any) {
      this.logger.error('Error procesando webhook WhatsApp:', error.message);
    }

    return { status: 'ok' };
  }
}
