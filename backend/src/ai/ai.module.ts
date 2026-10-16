import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { OpenAiProvider } from './providers/openai.provider';
import { MockAiProvider } from './providers/mock-ai.provider';
import { ProductsModule } from '../products/products.module';

@Module({
  imports: [ProductsModule],
  providers: [AiService, OpenAiProvider, MockAiProvider],
  exports: [AiService],
})
export class AiModule {}
