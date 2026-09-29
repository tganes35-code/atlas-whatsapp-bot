import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { OpenAiProvider } from './providers/openai.provider';
import { MockAiProvider } from './providers/mock-ai.provider';
import { ProductsModule } from '../products/products.module';
import { CartsModule } from '../carts/carts.module';
import { OrdersModule } from '../orders/orders.module';
import { CustomersModule } from '../customers/customers.module';
import { ConversationsModule } from '../conversations/conversations.module';
import { CompanyModule } from '../company/company.module';

@Module({
  imports: [
    ProductsModule,
    CartsModule,
    OrdersModule,
    CustomersModule,
    ConversationsModule,
    CompanyModule,
  ],
  providers: [AiService, OpenAiProvider, MockAiProvider],
  exports: [AiService],
})
export class AiModule {}
