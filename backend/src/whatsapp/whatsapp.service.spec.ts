import { ConfigService } from '@nestjs/config';
import { createHmac } from 'node:crypto';
import { WhatsappService } from './whatsapp.service';

describe('WhatsappService webhook handling', () => {
  const appSecret = 'test-app-secret';
  const verifyToken = 'test-verify-token';
  let service: WhatsappService;

  const createService = (localMode = 'true') => {
    const config = {
      get: jest.fn((key: string) => {
        if (key === 'LOCAL_MODE') return localMode;
        if (key === 'WHATSAPP_ACCESS_TOKEN') return 'test-access-token';
        if (key === 'WHATSAPP_PHONE_NUMBER_ID') return 'configured-phone-id';
        if (key === 'WHATSAPP_APP_SECRET') return appSecret;
        if (key === 'WHATSAPP_VERIFY_TOKEN') return verifyToken;
        return undefined;
      }),
    } as unknown as ConfigService;
    return new WhatsappService(config);
  };

  beforeEach(() => {
    service = createService();
  });

  it('validates signatures against the exact raw request body', () => {
    const body = Buffer.from('{"object":"whatsapp_business_account"}');
    const signature = `sha256=${createHmac('sha256', appSecret).update(body).digest('hex')}`;

    expect(service.isValidWebhookSignature(signature, body)).toBe(true);
    expect(service.isValidWebhookSignature(signature, Buffer.from('{}'))).toBe(
      false,
    );
    expect(service.isValidWebhookSignature(undefined, body)).toBe(false);
  });

  it('requires the configured token to verify the Meta webhook', () => {
    expect(service.verifyWebhook('subscribe', verifyToken, 'challenge')).toBe(
      'challenge',
    );
    expect(
      service.verifyWebhook('subscribe', 'wrong-token', 'challenge'),
    ).toBeNull();
  });

  it('parses all text messages and ignores status and non-text events', () => {
    const body = {
      entry: [
        {
          changes: [
            {
              value: {
                messages: [
                  {
                    id: 'wamid.1',
                    from: '1001',
                    type: 'text',
                    text: { body: 'Hola' },
                  },
                  {
                    id: 'wamid.2',
                    from: '1002',
                    type: 'image',
                    image: { id: 'media' },
                  },
                ],
              },
            },
            { value: { statuses: [{ id: 'wamid.3', status: 'delivered' }] } },
          ],
        },
        {
          changes: [
            {
              value: {
                messages: [
                  {
                    id: 'wamid.4',
                    from: '1004',
                    type: 'text',
                    text: { body: 'Precio' },
                  },
                ],
              },
            },
          ],
        },
      ],
    };

    expect(service.parseWebhookMessages(body)).toEqual([
      { id: 'wamid.1', phone: '1001', message: 'Hola' },
      { id: 'wamid.4', phone: '1004', message: 'Precio' },
    ]);
    expect(service.parseWebhookMessages(null)).toEqual([]);
  });

  it('ignores signed webhook messages for a different phone number in production', () => {
    const productionService = createService('false');
    const body = {
      entry: [
        {
          changes: [
            {
              value: {
                metadata: { phone_number_id: '123456123' },
                messages: [
                  {
                    id: 'wamid.test',
                    from: '16315551181',
                    type: 'text',
                    text: { body: 'this is a text message' },
                  },
                ],
              },
            },
          ],
        },
      ],
    };

    expect(productionService.parseWebhookMessages(body)).toEqual([]);
  });

  it('parses messages for the configured phone number in production', () => {
    const productionService = createService('false');
    const body = {
      entry: [
        {
          changes: [
            {
              value: {
                metadata: { phone_number_id: 'configured-phone-id' },
                messages: [
                  {
                    id: 'wamid.real',
                    from: '1001',
                    type: 'text',
                    text: { body: 'Hola' },
                  },
                ],
              },
            },
          ],
        },
      ],
    };

    expect(productionService.parseWebhookMessages(body)).toEqual([
      { id: 'wamid.real', phone: '1001', message: 'Hola' },
    ]);
  });
});
