import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { DatabaseService } from './drizzle/database/database.service.js';

describe('AppController', () => {
  let appController: AppController;
  let databaseService: { ping: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    databaseService = {
      ping: vi.fn().mockResolvedValue(true),
    };

    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        AppService,
        {
          provide: DatabaseService,
          useValue: databaseService,
        },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(appController.getHello()).toBe('Hello World!');
    });
  });

  describe('health check', () => {
    it('should return health status ok', () => {
      const health = appController.getHealth();
      expect(health.status).toBe('ok');
      expect(health.timestamp).toBeDefined();
      expect(typeof health.uptime).toBe('number');
    });

    it('should return readiness status when db is connected', async () => {
      const ready = await appController.getReadiness();
      expect(ready.status).toBe('ok');
      expect(ready.database).toBe('connected');
    });

    it('should throw service unavailable when db ping fails', async () => {
      databaseService.ping.mockResolvedValueOnce(false);
      await expect(appController.getReadiness()).rejects.toThrow();
    });
  });
});
