import { Test, TestingModule } from '@nestjs/testing';
import { PublicApplicationController } from './public-application.controller';

describe('PublicApplicationController', () => {
  let controller: PublicApplicationController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PublicApplicationController],
    }).compile();

    controller = module.get<PublicApplicationController>(PublicApplicationController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
