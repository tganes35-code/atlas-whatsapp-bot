import { PrismaService } from '../database/prisma.service';
import { ProductsService } from './products.service';

describe('ProductsService.searchForBot', () => {
  it('searches useful words from a full Spanish product question', async () => {
    const findMany = jest.fn().mockResolvedValue([]);
    const prisma = {
      product: { findMany },
    } as unknown as PrismaService;
    const service = new ProductsService(prisma);

    await service.searchForBot('¿Cuánto cuesta la Camiseta Clásica Blanca?');

    const where = findMany.mock.calls[0][0].where;
    expect(where.active).toBe(true);
    expect(where.OR).toEqual(
      expect.arrayContaining([
        { name: { contains: 'camiseta', mode: 'insensitive' } },
        { name: { contains: 'clasica', mode: 'insensitive' } },
        { name: { contains: 'blanca', mode: 'insensitive' } },
      ]),
    );
    expect(where.OR).not.toEqual(
      expect.arrayContaining([
        { name: { contains: 'cuanto', mode: 'insensitive' } },
        { name: { contains: 'cuesta', mode: 'insensitive' } },
      ]),
    );
  });

  it('returns active catalog products when no useful search words remain', async () => {
    const findMany = jest.fn().mockResolvedValue([]);
    const prisma = {
      product: { findMany },
    } as unknown as PrismaService;
    const service = new ProductsService(prisma);

    await service.searchForBot('¿Cuánto cuesta?');

    expect(findMany.mock.calls[0][0].where).toEqual({ active: true });
  });
});
