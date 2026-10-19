import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Query,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { WhatsappService } from './whatsapp.service';
import { MessagesService } from '../messages/messages.service';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('whatsapp')
@Controller('webhooks/whatsapp')
export class WhatsappController {
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
  async receiveMessage(
    @Body() body: unknown,
    @Req() request: RawBodyRequest<Request>,
  ) {
    const signature = request.headers['x-hub-signature-256'];
    if (
      typeof signature !== 'string' ||
      !this.whatsappService.isValidWebhookSignature(signature, request.rawBody)
    ) {
      throw new UnauthorizedException('Invalid WhatsApp webhook signature');
    }

    const messages = this.whatsappService.parseWebhookMessages(body);
    for (const parsed of messages) {
      const result = await this.messagesService.processIncomingMessage(
        {
          phone: parsed.phone,
          message: parsed.message,
          channel: 'WHATSAPP',
        },
        parsed.id,
      );

      if (result.shouldSend && result.botResponse) {
        await this.whatsappService.sendTextMessage(
          parsed.phone,
          result.botResponse,
        );
        await this.messagesService.markBotResponseSent(result.messageId);
      }
    }

    return { status: 'ok' };
  }
}
