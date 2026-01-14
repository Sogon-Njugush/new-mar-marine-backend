import { Test, TestingModule } from '@nestjs/testing';
import { WialonHistoryController } from './wialon-history.controller';
import { WialonHistoryService } from './wialon-history.service';

describe('WialonHistoryController', () => {
  let controller: WialonHistoryController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WialonHistoryController],
      providers: [WialonHistoryService],
    }).compile();

    controller = module.get<WialonHistoryController>(WialonHistoryController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
