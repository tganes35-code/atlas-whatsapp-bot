import {
  Body, Controller, Delete, Get, Param, Patch, Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CartsService } from './carts.service';
import { AddToCartDto, UpdateCartItemDto } from './dto/add-to-cart.dto';

@ApiTags('carts')
@ApiBearerAuth()
@Controller('carts')
export class CartsController {
  constructor(private readonly cartsService: CartsService) {}

  @Get(':customerId')
  @ApiOperation({ summary: 'Obtener carrito activo de un cliente' })
  getCart(@Param('customerId') customerId: string) {
    return this.cartsService.getOrCreateActiveCart(customerId);
  }

  @Post(':customerId/items')
  @ApiOperation({ summary: 'Agregar producto al carrito' })
  addItem(
    @Param('customerId') customerId: string,
    @Body() dto: AddToCartDto,
  ) {
    return this.cartsService.addItem(customerId, dto);
  }

  @Patch(':customerId/items/:itemId')
  @ApiOperation({ summary: 'Actualizar cantidad de un item (0 = eliminar)' })
  updateItem(
    @Param('customerId') customerId: string,
    @Param('itemId') itemId: string,
    @Body() dto: UpdateCartItemDto,
  ) {
    return this.cartsService.updateItem(customerId, itemId, dto);
  }

  @Delete(':customerId/items/:itemId')
  @ApiOperation({ summary: 'Eliminar item del carrito' })
  removeItem(
    @Param('customerId') customerId: string,
    @Param('itemId') itemId: string,
  ) {
    return this.cartsService.removeItem(customerId, itemId);
  }

  @Delete(':customerId')
  @ApiOperation({ summary: 'Vaciar carrito' })
  clearCart(@Param('customerId') customerId: string) {
    return this.cartsService.clearCart(customerId);
  }
}
