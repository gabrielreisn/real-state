import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';
import type { CreateLeadDto } from './create-lead.dto.js';
import { Lead } from './lead.entity.js';

@Injectable()
export class LeadsService {
  constructor(@InjectRepository(Lead) private readonly leads: Repository<Lead>) {}

  create(dto: CreateLeadDto) {
    return this.leads.save(
      this.leads.create({
        name: dto.name,
        phone: dto.phone,
        email: dto.email ?? null,
        message: dto.message,
        propertyCode: dto.propertyCode ?? null,
      }),
    );
  }
}
