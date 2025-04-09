import { Test, TestingModule } from '@nestjs/testing';
import { AdminApplicationController } from './admin-application.controller';

describe('AdminApplicationController', () => {
  let controller: AdminApplicationController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminApplicationController],
    }).compile();

    controller = module.get<AdminApplicationController>(AdminApplicationController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
