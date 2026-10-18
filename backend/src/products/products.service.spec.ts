import { Test, TestingModule } from '@nestjs/testing';
import { ProductsService } from './products.service.js';
import { DatabaseService } from '../drizzle/database/database.service.js';
import { InventoryService } from '../inventory/inventory.service.js';

describe('ProductsService', () => {
  let service: ProductsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        InventoryService,
        { provide: DatabaseService, useValue: {} },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
