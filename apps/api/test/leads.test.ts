import 'reflect-metadata';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { configureApp } from '../src/configure-app.js';
import { Lead } from '../src/leads/lead.entity.js';
import { LeadsController } from '../src/leads/leads.controller.js';
import { LeadsService } from '../src/leads/leads.service.js';

const valid = { name: 'Maria', phone: '(27) 99999-0000', message: 'Tenho interesse', propertyCode: '1170' };

describe('POST /leads', () => {
  let app: INestApplication;
  const repository = { create: vi.fn((lead: unknown) => lead), save: vi.fn() };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [LeadsController],
      providers: [LeadsService, { provide: getRepositoryToken(Lead), useValue: repository }],
    }).compile();
    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
  });

  afterAll(() => app.close());

  beforeEach(() => {
    repository.save.mockReset();
    repository.save.mockResolvedValue({ id: 'lead-id' });
  });

  it('stores a valid lead and only returns its id', async () => {
    const response = await request(app.getHttpServer()).post('/leads').send(valid).expect(201);
    expect(response.body).toEqual({ id: 'lead-id' });
    expect(repository.save).toHaveBeenCalledWith({ ...valid, email: null });
  });

  it('treats a blank e-mail as absent', async () => {
    await request(app.getHttpServer()).post('/leads').send({ ...valid, email: '  ' }).expect(201);
    expect(repository.save).toHaveBeenCalledWith(expect.objectContaining({ email: null }));
  });

  it.each([
    ['a missing name', { ...valid, name: undefined }],
    ['a blank name', { ...valid, name: '   ' }],
    ['a phone that is too short', { ...valid, phone: '12345' }],
    ['a malformed e-mail', { ...valid, email: 'not-an-email' }],
    ['an empty message', { ...valid, message: '' }],
    ['unknown fields', { ...valid, isAdmin: true }],
  ])('rejects %s', async (_case, body) => {
    await request(app.getHttpServer()).post('/leads').send(body).expect(400);
    expect(repository.save).not.toHaveBeenCalled();
  });
});
