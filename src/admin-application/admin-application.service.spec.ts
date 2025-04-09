import { Test, TestingModule } from '@nestjs/testing';
import { AdminApplicationService } from './admin-application.service';

describe('AdminApplicationService', () => {
  let service: AdminApplicationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AdminApplicationService],
    }).compile();

    service = module.get<AdminApplicationService>(AdminApplicationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
