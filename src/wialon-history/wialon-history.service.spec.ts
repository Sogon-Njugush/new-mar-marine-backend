import { Test, TestingModule } from '@nestjs/testing';
import { WialonHistoryService } from './wialon-history.service';

describe('WialonHistoryService', () => {
  let service: WialonHistoryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WialonHistoryService],
    }).compile();

    service = module.get<WialonHistoryService>(WialonHistoryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
