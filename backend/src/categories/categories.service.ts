import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateCategoryDto) {
    const exists = await this.prisma.category.findUnique({
      where: { name: dto.name },
    });
    if (exists) {
      throw new ConflictException('Ya existe una categoría con ese nombre');
    }
    return this.prisma.category.create({ data: dto });
  }

  async findAll(includeInactive = false) {
    return this.prisma.category.findMany({
      where: includeInactive ? {} : { active: true },
      include: {
        _count: { select: { products: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: {
        products: {
          where: { active: true },
          orderBy: { name: 'asc' },
        },
      },
    });
    if (!category) throw new NotFoundException('Categoría no encontrada');
    return category;
  }

  async update(id: string, dto: UpdateCategoryDto) {
    await this.findOne(id);

    if (dto.name) {
      const exists = await this.prisma.category.findFirst({
        where: { name: dto.name, id: { not: id } },
      });
      if (exists) throw new ConflictException('Ya existe una categoría con ese nombre');
    }

    return this.prisma.category.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    const category = await this.findOne(id);
    const productCount = await this.prisma.product.count({
      where: { categoryId: id, active: true },
    });

    if (productCount > 0) {
      // Desactivar en lugar de eliminar si tiene productos
      return this.prisma.category.update({
        where: { id },
        data: { active: false },
      });
    }

    return this.prisma.category.delete({ where: { id } });
  }
}
