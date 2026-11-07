import { Body, Controller, Post } from '@nestjs/common';
import { CreateLeadDto } from './create-lead.dto.js';
import { LeadsService } from './leads.service.js';

// Write-only on purpose: leads hold personal data, and there is no authentication yet to guard a read endpoint.
@Controller('leads')
export class LeadsController {
  constructor(private readonly leads: LeadsService) {}

  @Post()
  async create(@Body() dto: CreateLeadDto) {
    const lead = await this.leads.create(dto);
    return { id: lead.id };
  }
}
