import { Test, TestingModule } from '@nestjs/testing';
import { ProductsController } from './products.controller.js';
import { ProductsService } from './products.service.js';
import { DatabaseService } from '../drizzle/database/database.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../auth/guards/permissions.guard.js';

describe('ProductsController', () => {
  let controller: ProductsController;

  beforeEach(async () => {
    const builder = Test.createTestingModule({
      controllers: [ProductsController],
      providers: [ProductsService, { provide: DatabaseService, useValue: {} }],
    });
    const module: TestingModule = await builder
      .overrideGuard(JwtAuthGuard)
      .useValue({})
      .overrideGuard(PermissionsGuard)
      .useValue({})
      .compile();

    controller = module.get<ProductsController>(ProductsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
