import { Test, TestingModule } from '@nestjs/testing';
import { WialonService } from './wialon.service';

describe('WialonService', () => {
  let service: WialonService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WialonService],
    }).compile();

    service = module.get<WialonService>(WialonService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
