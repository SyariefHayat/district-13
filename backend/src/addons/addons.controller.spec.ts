import { Test, TestingModule } from '@nestjs/testing';
import { AddonsController } from './addons.controller.js';
import { AddonsService } from './addons.service.js';
import { DatabaseService } from '../drizzle/database/database.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../auth/guards/permissions.guard.js';

describe('AddonsController', () => {
  let controller: AddonsController;

  beforeEach(async () => {
    const builder = Test.createTestingModule({
      controllers: [AddonsController],
      providers: [AddonsService, { provide: DatabaseService, useValue: {} }],
    });
    const module: TestingModule = await builder
      .overrideGuard(JwtAuthGuard)
      .useValue({})
      .overrideGuard(PermissionsGuard)
      .useValue({})
      .compile();

    controller = module.get<AddonsController>(AddonsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
