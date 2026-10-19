import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { rawBody: true });
  const logger = new Logger('Bootstrap');

  // ─── Seguridad ──────────────────────────────────────────────
  app.use(helmet());

  // ─── Prefijo global de API ───────────────────────────────────
  app.setGlobalPrefix('api');

  // ─── Validación global ──────────────────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // ─── Swagger ────────────────────────────────────────────────
  const config = new DocumentBuilder()
    .setTitle('Atlas WhatsApp Bot API')
    .setDescription('API WhatsApp Chatbot - Lightweight para producción')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('auth', 'Autenticación')
    .addTag('categories', 'Categorías')
    .addTag('products', 'Productos')
    .addTag('messages', 'Mensajes / Chatbot')
    .addTag('whatsapp', 'WhatsApp Webhook')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  const port = process.env.PORT ?? 3000;
  await app.listen(port);

  logger.log(`🚀 Backend corriendo en: http://localhost:${port}`);
  logger.log(`📖 Swagger disponible en: http://localhost:${port}/api/docs`);
  logger.log(
    `🤖 Modo IA: ${process.env.OPENAI_API_KEY ? 'OpenAI' : 'MockAI (sin API key)'}`,
  );
  logger.log(
    `📱 Modo WhatsApp: ${process.env.LOCAL_MODE !== 'false' ? 'LOCAL' : 'PRODUCCIÓN'}`,
  );
}

bootstrap();
