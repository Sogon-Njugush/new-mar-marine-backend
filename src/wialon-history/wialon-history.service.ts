import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DailyReport } from './entities/daily-report.entity';
import { WialonService } from '../wialon/wialon.service';

@Injectable()
export class WialonHistoryService {
  private readonly logger = new Logger(WialonHistoryService.name);

  constructor(
    @InjectRepository(DailyReport)
    private readonly reportRepo: Repository<DailyReport>,
    private readonly wialonService: WialonService,
  ) {}

  // ===========================================================================
  // 📅 SYNC LAST 3 MONTHS
  // ===========================================================================
  async syncLastThreeMonths() {
    // this.logger.log('⏳ Starting 90-Day History Sync...');

    const units = await this.wialonService.getUnits();
    const templates = await this.wialonService.getAllReportTemplates();

    // Filter only the templates we care about
    const targetTemplates = templates.filter((t) =>
      ['Motion', 'Machine Activity'].includes(t.templateName),
    );

    const today = new Date();
    // Loop 90 days back
    for (let d = 0; d < 90; d++) {
      const date = new Date(today);
      date.setDate(date.getDate() - d); // Go back 'd' days

      // Set strict 00:00:00 to 23:59:59 for that specific day
      date.setHours(0, 0, 0, 0);
      const from = Math.floor(date.getTime() / 1000);
      const to = from + 86399; // End of day

      const dateString = date.toISOString().split('T')[0];
      // this.logger.log(`📅 Processing Date: ${dateString}`);

      for (const unit of units) {
        for (const temp of targetTemplates) {
          await this.fetchAndSaveDay(unit, temp, from, to, dateString);
        }
      }
    }
    // this.logger.log('✅ 90-Day History Sync Complete.');
    return { message: 'Sync started in background (check logs)' };
  }

  private async fetchAndSaveDay(
    unit: any,
    template: any,
    from: number,
    to: number,
    dateString: string,
  ) {
    try {
      const data = await this.wialonService.fetchRawReportData(
        unit,
        template.templateId,
        template.resourceId,
        from,
        to,
      );

      // 👇 FIX: Use (length ?? 0) to ensure we always compare numbers
      const statsLen = data.stats?.length ?? 0;
      const tablesLen = data.tables?.length ?? 0;

      if (data && (statsLen > 0 || tablesLen > 0)) {
        // Save to new History Table
        await this.reportRepo.upsert(
          {
            unitId: unit.id,
            unitName: unit.name,
            date: dateString,
            reportName: template.templateName,
            stats: data.stats || [],
            tables: data.tables || [],
            syncedAt: new Date(),
          },
          ['unitId', 'date', 'reportName'],
        ); // Unique constraint conflict path

        // this.logger.debug(
        //   `💾 Saved ${template.templateName} for ${unit.name} on ${dateString}`,
        // );
      }
    } catch (e) {
      this.logger.error(`Failed ${unit.name} on ${dateString}: ${e.message}`);
    }
  }

  async getHistoryRange(unitId?: number, from?: string, to?: string) {
    const query = this.reportRepo
      .createQueryBuilder('report')
      .orderBy('report.date', 'DESC');

    if (unitId) {
      query.andWhere('report.unitId = :unitId', { unitId });
    }

    // Filter by Date Range (if provided)
    if (from) {
      query.andWhere('report.date >= :from', { from });
    }
    if (to) {
      query.andWhere('report.date <= :to', { to });
    }

    return await query.getMany();
  }

  // ===========================================================================
  // 🔍 QUERY METHOD
  // ===========================================================================
  async getDayData(date: string, unitId?: number) {
    const query = this.reportRepo
      .createQueryBuilder('report')
      .where('report.date = :date', { date });

    if (unitId) {
      query.andWhere('report.unitId = :unitId', { unitId });
    }

    return await query.getMany();
  }
}
