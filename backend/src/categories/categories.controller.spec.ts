import { Test, TestingModule } from '@nestjs/testing';
import { CategoriesController } from './categories.controller.js';
import { CategoriesService } from './categories.service.js';
import { DatabaseService } from '../drizzle/database/database.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../auth/guards/permissions.guard.js';

describe('CategoriesController', () => {
  let controller: CategoriesController;

  beforeEach(async () => {
    const builder = Test.createTestingModule({
      controllers: [CategoriesController],
      providers: [
        CategoriesService,
        { provide: DatabaseService, useValue: {} },
      ],
    });
    const module: TestingModule = await builder
      .overrideGuard(JwtAuthGuard)
      .useValue({})
      .overrideGuard(PermissionsGuard)
      .useValue({})
      .compile();

    controller = module.get<CategoriesController>(CategoriesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
