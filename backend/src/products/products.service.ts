import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateProductDto) {
    const skuExists = await this.prisma.product.findUnique({
      where: { sku: dto.sku },
    });
    if (skuExists) throw new ConflictException('El SKU ya existe');

    const category = await this.prisma.category.findUnique({
      where: { id: dto.categoryId },
    });
    if (!category) throw new NotFoundException('Categoría no encontrada');

    const { variants, ...productData } = dto;

    return this.prisma.product.create({
      data: {
        ...productData,
        variants: variants ? { create: variants } : undefined,
      },
      include: { category: true, variants: true },
    });
  }

  async findAll(options?: {
    search?: string;
    categoryId?: string;
    active?: boolean;
    page?: number;
    limit?: number;
  }) {
    const {
      search,
      categoryId,
      active = true,
      page = 1,
      limit = 20,
    } = options ?? {};
    const skip = (page - 1) * limit;

    const where: any = { active };
    if (categoryId) where.categoryId = categoryId;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        include: {
          category: { select: { id: true, name: true } },
          variants: { where: { active: true } },
        },
        orderBy: { name: 'asc' },
        skip,
        take: limit,
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        variants: { where: { active: true } },
      },
    });
    if (!product) throw new NotFoundException('Producto no encontrado');
    return product;
  }

  async findBySku(sku: string) {
    const product = await this.prisma.product.findUnique({
      where: { sku },
      include: {
        category: { select: { id: true, name: true } },
        variants: { where: { active: true } },
      },
    });
    if (!product) throw new NotFoundException('Producto no encontrado');
    return product;
  }

  async update(id: string, dto: UpdateProductDto) {
    await this.findOne(id);

    if (dto.sku) {
      const skuExists = await this.prisma.product.findFirst({
        where: { sku: dto.sku, id: { not: id } },
      });
      if (skuExists) throw new ConflictException('El SKU ya existe');
    }

    if (dto.categoryId) {
      const category = await this.prisma.category.findUnique({
        where: { id: dto.categoryId },
      });
      if (!category) throw new NotFoundException('Categoría no encontrada');
    }

    return this.prisma.product.update({
      where: { id },
      data: dto,
      include: { category: true, variants: true },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.product.update({
      where: { id },
      data: { active: false },
    });
  }

  async searchForBot(query: string) {
    const ignoredTerms = new Set([
      'con',
      'cual',
      'cuanto',
      'cuesta',
      'de',
      'disponible',
      'el',
      'en',
      'es',
      'hay',
      'la',
      'las',
      'los',
      'me',
      'para',
      'por',
      'precio',
      'que',
      'quiero',
      'saber',
      'un',
      'una',
      'ver',
    ]);
    const searchTerms = [
      ...new Set(
        (query.toLowerCase().match(/[\p{L}\p{N}-]+/gu) ?? []).filter(
          (term) =>
            term.normalize('NFD').replace(/\p{Diacritic}/gu, '').length > 2 &&
            !ignoredTerms.has(
              term.normalize('NFD').replace(/\p{Diacritic}/gu, ''),
            ),
        ),
      ),
    ];
    const terms = searchTerms.length ? searchTerms : [''];
    const matches = await Promise.all(
      terms.map((term) =>
        this.prisma.product.findMany({
          where: {
            active: true,
            OR: [
              { name: { contains: term, mode: 'insensitive' } },
              { description: { contains: term, mode: 'insensitive' } },
              { category: { name: { contains: term, mode: 'insensitive' } } },
            ],
          },
          include: {
            category: { select: { id: true, name: true } },
            variants: { where: { active: true } },
          },
          take: 5,
        }),
      ),
    );
    const products = new Map<string, (typeof matches)[number][number]>();
    for (const group of matches) {
      for (const product of group) {
        products.set(product.id, product);
      }
    }
    return [...products.values()].slice(0, 5);
  }
}
