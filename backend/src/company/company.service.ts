import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { UpdateCompanyDto } from './dto/update-company.dto';

@Injectable()
export class CompanyService {
  constructor(private readonly prisma: PrismaService) {}

  async getCompany() {
    const company = await this.prisma.company.findFirst();
    if (!company) {
      throw new NotFoundException('Empresa no encontrada');
    }
    return company;
  }

  async updateCompany(dto: UpdateCompanyDto) {
    const company = await this.prisma.company.findFirst();
    if (!company) {
      throw new NotFoundException('Empresa no encontrada');
    }

    return this.prisma.company.update({
      where: { id: company.id },
      data: dto,
    });
  }
}
