import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { PrismaService } from '../database/prisma.service';
import * as argon2 from 'argon2';

// Mock de argon2
jest.mock('argon2');
const mockArgon2 = argon2 as jest.Mocked<typeof argon2>;

describe('AuthService', () => {
  let service: AuthService;
  let prisma: any;
  let jwtService: any;

  const mockUser = {
    id: 'user-123',
    name: 'Admin Atlas',
    email: 'admin@atlas.local',
    password: 'hashed-password',
    role: 'ADMIN',
    active: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn(),
            },
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('mock-jwt-token'),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get<PrismaService>(PrismaService);
    jwtService = module.get<JwtService>(JwtService);
  });

  describe('login', () => {
    it('debe retornar token y usuario con credenciales correctas', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      (mockArgon2.verify as jest.Mock).mockResolvedValue(true);

      const result = await service.login({
        email: 'admin@atlas.local',
        password: 'Admin123!',
      });

      expect(result.access_token).toBe('mock-jwt-token');
      expect(result.user.email).toBe('admin@atlas.local');
      expect(result.user.role).toBe('ADMIN');
    });

    it('debe lanzar UnauthorizedException si el usuario no existe', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.login({ email: 'noexiste@test.com', password: 'pass' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('debe lanzar UnauthorizedException si la contraseña es incorrecta', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      (mockArgon2.verify as jest.Mock).mockResolvedValue(false);

      await expect(
        service.login({ email: 'admin@atlas.local', password: 'wrong' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('debe lanzar UnauthorizedException si el usuario está inactivo', async () => {
      prisma.user.findUnique.mockResolvedValue({ ...mockUser, active: false });

      await expect(
        service.login({ email: 'admin@atlas.local', password: 'Admin123!' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('getMe', () => {
    it('debe retornar el usuario sin la contraseña', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: mockUser.id,
        name: mockUser.name,
        email: mockUser.email,
        role: mockUser.role,
        createdAt: mockUser.createdAt,
      });

      const result = await service.getMe(mockUser.id);
      expect(result.email).toBe(mockUser.email);
      expect((result as any).password).toBeUndefined();
    });
  });
});
