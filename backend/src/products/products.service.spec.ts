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

    const searches = findMany.mock.calls.map(([args]) => args.where.OR);
    expect(findMany).toHaveBeenCalledTimes(3);
    expect(searches[0]).toEqual(
      expect.arrayContaining([
        { name: { contains: 'camiseta', mode: 'insensitive' } },
      ]),
    );
    expect(searches[1]).toEqual(
      expect.arrayContaining([
        { name: { contains: 'clásica', mode: 'insensitive' } },
      ]),
    );
    expect(searches[2]).toEqual(
      expect.arrayContaining([
        { name: { contains: 'blanca', mode: 'insensitive' } },
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

    expect(findMany).toHaveBeenCalledTimes(1);
    expect(findMany.mock.calls[0][0].where).toEqual({
      active: true,
      OR: [
        { name: { contains: '', mode: 'insensitive' } },
        { description: { contains: '', mode: 'insensitive' } },
        { category: { name: { contains: '', mode: 'insensitive' } } },
      ],
    });
  });
});
