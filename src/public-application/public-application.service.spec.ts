import { Test, TestingModule } from '@nestjs/testing';
import { PublicApplicationService } from './public-application.service';

describe('PublicApplicationService', () => {
  let service: PublicApplicationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PublicApplicationService],
    }).compile();

    service = module.get<PublicApplicationService>(PublicApplicationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
