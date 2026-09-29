import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class WhatsappService {
  private readonly logger = new Logger(WhatsappService.name);
  private readonly localMode: boolean;
  private readonly accessToken: string;
  private readonly phoneNumberId: string;

  constructor(private readonly config: ConfigService) {
    this.localMode = this.config.get<string>('LOCAL_MODE') !== 'false';
    this.accessToken = this.config.get<string>('WHATSAPP_ACCESS_TOKEN') ?? '';
    this.phoneNumberId = this.config.get<string>('WHATSAPP_PHONE_NUMBER_ID') ?? '';

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
        `https://graph.facebook.com/v18.0/${this.phoneNumberId}/messages`,
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
    } catch (error: any) {
      this.logger.error(`Error enviando mensaje WhatsApp a ${to}:`, error.message);
      throw error;
    }
  }

  async sendImageMessage(to: string, imageUrl: string, caption?: string): Promise<void> {
    if (this.localMode) {
      this.logger.debug(`[LOCAL] Imagen → ${to}: ${imageUrl}`);
      return;
    }

    await axios.post(
      `https://graph.facebook.com/v18.0/${this.phoneNumberId}/messages`,
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
    components?: any[],
  ): Promise<void> {
    if (this.localMode) {
      this.logger.debug(`[LOCAL] Template "${templateName}" → ${to}`);
      return;
    }

    await axios.post(
      `https://graph.facebook.com/v18.0/${this.phoneNumberId}/messages`,
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
    const verifyToken = this.config.get<string>('WHATSAPP_VERIFY_TOKEN') ?? 'atlas-verify-token';
    if (mode === 'subscribe' && token === verifyToken) {
      return challenge;
    }
    return null;
  }

  parseWebhookMessage(body: any): { phone: string; message: string } | null {
    try {
      const entry = body?.entry?.[0];
      const change = entry?.changes?.[0];
      const value = change?.value;
      const messages = value?.messages;

      if (!messages?.length) return null;

      const msg = messages[0];
      const phone = msg.from;
      const message = msg.type === 'text' ? msg.text?.body : '[Mensaje no textual]';

      return { phone, message };
    } catch {
      return null;
    }
  }
}
