import { Test, TestingModule } from '@nestjs/testing';
import { AddonsService } from './addons.service.js';
import { DatabaseService } from '../drizzle/database/database.service.js';

describe('AddonsService', () => {
  let service: AddonsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AddonsService, { provide: DatabaseService, useValue: {} }],
    }).compile();

    service = module.get<AddonsService>(AddonsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
