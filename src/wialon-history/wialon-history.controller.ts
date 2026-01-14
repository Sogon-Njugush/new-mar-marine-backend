import { Controller, Post, Get, Query } from '@nestjs/common';
import { WialonHistoryService } from './wialon-history.service';

@Controller('wialon/history')
export class WialonHistoryController {
  constructor(private readonly historyService: WialonHistoryService) {}

  @Post('sync-90-days')
  async triggerSync() {
    // This runs in background to prevent timeout
    this.historyService.syncLastThreeMonths();
    return {
      message: 'Started 90-day sync process. Check server logs for progress.',
    };
  }

  @Get('day')
  async getDailyData(
    @Query('date') date: string, // Format YYYY-MM-DD
    @Query('unitId') unitId?: string,
  ) {
    if (!date) return { error: 'Date parameter (YYYY-MM-DD) is required' };

    return this.historyService.getDayData(
      date,
      unitId ? parseInt(unitId) : undefined,
    );
  }
}
