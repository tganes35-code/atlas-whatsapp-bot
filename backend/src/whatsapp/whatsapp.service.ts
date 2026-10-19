import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, timingSafeEqual } from 'node:crypto';
import axios from 'axios';

export interface ParsedWhatsappMessage {
  id: string;
  phone: string;
  message: string;
}

@Injectable()
export class WhatsappService {
  private readonly logger = new Logger(WhatsappService.name);
  private readonly localMode: boolean;
  private readonly accessToken: string;
  private readonly phoneNumberId: string;
  private readonly graphApiVersion = 'v26.0';

  constructor(private readonly config: ConfigService) {
    this.localMode = this.config.get<string>('LOCAL_MODE') !== 'false';
    this.accessToken = this.config.get<string>('WHATSAPP_ACCESS_TOKEN') ?? '';
    this.phoneNumberId =
      this.config.get<string>('WHATSAPP_PHONE_NUMBER_ID') ?? '';

    if (
      !this.localMode &&
      (!this.accessToken ||
        !this.phoneNumberId ||
        !this.config.get<string>('WHATSAPP_APP_SECRET') ||
        !this.config.get<string>('WHATSAPP_VERIFY_TOKEN'))
    ) {
      throw new Error(
        'WhatsApp access token, phone number ID, app secret, and verify token must be configured when LOCAL_MODE=false',
      );
    }

    if (this.localMode) {
      this.logger.warn('WhatsApp en modo LOCAL — mensajes no se envían a Meta');
    } else {
      this.logger.log('WhatsApp en modo PRODUCCIÓN');
    }
  }

  async sendTextMessage(to: string, message: string): Promise<void> {
    if (this.localMode) {
      this.logger.debug(`[LOCAL] → ${to}: ${message.substring(0, 80)}...`);
      return;
    }

    try {
      await axios.post(
        `https://graph.facebook.com/${this.graphApiVersion}/${this.phoneNumberId}/messages`,
        {
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to,
          type: 'text',
          text: { body: message },
        },
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
        },
      );
    } catch (error) {
      this.logger.error(
        `Error enviando mensaje WhatsApp a ${to}:`,
        error instanceof Error ? error.message : String(error),
      );
      throw error;
    }
  }

  async sendImageMessage(
    to: string,
    imageUrl: string,
    caption?: string,
  ): Promise<void> {
    if (this.localMode) {
      this.logger.debug(`[LOCAL] Imagen → ${to}: ${imageUrl}`);
      return;
    }

    await axios.post(
      `https://graph.facebook.com/${this.graphApiVersion}/${this.phoneNumberId}/messages`,
      {
        messaging_product: 'whatsapp',
        to,
        type: 'image',
        image: { link: imageUrl, caption },
      },
      {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
      },
    );
  }

  async sendTemplateMessage(
    to: string,
    templateName: string,
    languageCode = 'es',
    components?: object[],
  ): Promise<void> {
    if (this.localMode) {
      this.logger.debug(`[LOCAL] Template "${templateName}" → ${to}`);
      return;
    }

    await axios.post(
      `https://graph.facebook.com/${this.graphApiVersion}/${this.phoneNumberId}/messages`,
      {
        messaging_product: 'whatsapp',
        to,
        type: 'template',
        template: {
          name: templateName,
          language: { code: languageCode },
          components,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
      },
    );
  }

  verifyWebhook(mode: string, token: string, challenge: string): string | null {
    const verifyToken = this.config.get<string>('WHATSAPP_VERIFY_TOKEN');
    if (verifyToken && mode === 'subscribe' && token === verifyToken) {
      return challenge;
    }
    return null;
  }

  isValidWebhookSignature(
    signature: string | undefined,
    rawBody: Buffer | undefined,
  ): boolean {
    const appSecret = this.config.get<string>('WHATSAPP_APP_SECRET');
    if (!appSecret || !signature || !rawBody) {
      return false;
    }

    const expected = Buffer.from(
      `sha256=${createHmac('sha256', appSecret).update(rawBody).digest('hex')}`,
    );
    const received = Buffer.from(signature);
    return (
      expected.length === received.length && timingSafeEqual(expected, received)
    );
  }

  parseWebhookMessages(body: unknown): ParsedWhatsappMessage[] {
    if (!body || typeof body !== 'object') {
      return [];
    }

    const entries = (body as { entry?: unknown }).entry;
    if (!Array.isArray(entries)) {
      return [];
    }

    const parsed: ParsedWhatsappMessage[] = [];
    for (const entry of entries) {
      if (!entry || typeof entry !== 'object') {
        continue;
      }

      const changes = (entry as { changes?: unknown }).changes;
      if (!Array.isArray(changes)) {
        continue;
      }

      for (const change of changes) {
        if (!change || typeof change !== 'object') {
          continue;
        }

        const value = (change as { value?: unknown }).value;
        if (!value || typeof value !== 'object') {
          continue;
        }

        const messages = (value as { messages?: unknown }).messages;
        if (!Array.isArray(messages)) {
          continue;
        }

        for (const message of messages) {
          if (!message || typeof message !== 'object') {
            continue;
          }

          const candidate = message as {
            id?: unknown;
            from?: unknown;
            type?: unknown;
            text?: { body?: unknown };
          };
          if (
            candidate.type !== 'text' ||
            typeof candidate.id !== 'string' ||
            typeof candidate.from !== 'string' ||
            typeof candidate.text?.body !== 'string' ||
            candidate.text.body.trim().length === 0
          ) {
            continue;
          }

          parsed.push({
            id: candidate.id,
            phone: candidate.from,
            message: candidate.text.body,
          });
        }
      }
    }

    return parsed;
  }
}
