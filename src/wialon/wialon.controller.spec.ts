import { Test, TestingModule } from '@nestjs/testing';
import { WialonController } from './wialon.controller';
import { WialonService } from './wialon.service';

describe('WialonController', () => {
  let controller: WialonController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WialonController],
      providers: [WialonService],
    }).compile();

    controller = module.get<WialonController>(WialonController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
