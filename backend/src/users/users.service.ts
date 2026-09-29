import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import * as argon2 from 'argon2';
import { PrismaService } from '../database/prisma.service';

export class CreateUserDto {
  name: string;
  email: string;
  password: string;
  role?: UserRole;
}

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.user.findMany({
      where: { active: true },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    return user;
  }

  async create(dto: CreateUserDto) {
    const exists = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (exists) throw new ConflictException('El email ya está en uso');

    const password = await argon2.hash(dto.password);
    const user = await this.prisma.user.create({
      data: { ...dto, password, role: dto.role ?? UserRole.AGENT },
    });

    const { password: _, ...result } = user;
    return result;
  }

  async update(id: string, dto: Partial<CreateUserDto>) {
    await this.findOne(id);
    const data: any = { ...dto };
    if (dto.password) data.password = await argon2.hash(dto.password);
    const user = await this.prisma.user.update({ where: { id }, data });
    const { password: _, ...result } = user;
    return result;
  }

  async deactivate(id: string) {
    await this.findOne(id);
    return this.prisma.user.update({
      where: { id },
      data: { active: false },
      select: { id: true, name: true, email: true, active: true },
    });
  }
}
