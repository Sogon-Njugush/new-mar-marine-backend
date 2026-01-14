import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { firstValueFrom } from 'rxjs';
import { Unit } from './entities/unit.entity';
import { UnitEngineHours } from './entities/unit-engine-hours.entity';
import { ExecuteReportDto } from './dto/execute-report.dto';

export interface ReportTemplateDTO {
  templateId: number;
  templateName: string;
  templateType: string;
  resourceId: number;
  resourceName: string;
}

interface ReportConfig {
  name: string;
  resourceId: number;
  templateId: number;
  templateType: string;
}

@Injectable()
export class WialonService implements OnModuleInit {
  private readonly logger = new Logger(WialonService.name);
  private readonly wialonBaseUrl: string;
  private readonly apiToken: string;
  private currentSessionId: string | null = null;
  private isSyncRunning = false;
  private readonly TARGET_REPORT_NAMES = ['Motion', 'Machine Activity'];
  private cachedReportConfigs: ReportConfig[] = [];

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    @InjectRepository(Unit)
    private readonly unitRepo: Repository<Unit>,
    @InjectRepository(UnitEngineHours)
    private readonly engineHoursRepo: Repository<UnitEngineHours>,
  ) {
    this.wialonBaseUrl = this.configService.get<string>(
      'WIALON_HOST',
      'https://hst-api.wialon.com',
    );
    this.apiToken = this.configService.get<string>('WIALON_TOKEN')!;
    if (!this.apiToken) throw new Error('FATAL: WIALON_TOKEN is missing');
  }

  async onModuleInit() {
    this.logger.log('Wialon Module initialized.');
  }

  // ===========================================================================
  // 🟢 PUBLIC API METHODS
  // ===========================================================================

  async getUnits(sid?: string): Promise<any[]> {
    const session = sid || (await this.getValidSession());
    const data = await this.performRequest(
      'core/search_items',
      {
        spec: {
          itemsType: 'avl_unit',
          propName: 'sys_name',
          propValueMask: '*',
          sortType: 'sys_name',
        },
        force: 1,
        flags: 1,
        from: 0,
        to: 0,
      },
      session,
    );
    return data.items
      ? data.items.map((u: any) => ({ id: u.id, name: u.nm }))
      : [];
  }

  async getAllReportTemplates(): Promise<ReportTemplateDTO[]> {
    const sid = await this.getValidSession();
    const data = await this.performRequest(
      'core/search_items',
      {
        spec: {
          itemsType: 'avl_resource',
          propName: 'sys_name',
          propValueMask: '*',
          sortType: 'sys_name',
        },
        force: 1,
        flags: 8193,
        from: 0,
        to: 0,
      },
      sid,
    );
    return this.transformTemplatesResponse(data);
  }

  async executeReport(dto: ExecuteReportDto): Promise<any> {
    const sid = await this.getValidSession();

    // 🛡️ GUARD: Ensure templateId exists for single execution
    if (!dto.templateId) {
      throw new Error('Template ID is required for single report execution.');
    }

    // 👇 30 DAYS LOGIC
    const to = dto.to || Math.floor(Date.now() / 1000);
    const from = dto.from || to - 30 * 24 * 60 * 60;

    this.logger.log(
      `📝 Manual Report: ${new Date(from * 1000).toISOString()} to ${new Date(to * 1000).toISOString()}`,
    );

    return await this.processUnitReport(
      sid,
      { id: dto.objectId, name: 'Manual Run' },
      {
        resourceId: dto.resourceId,
        templateId: dto.templateId, // ✅ TypeScript now knows this is definitely a number
        name: 'Manual',
        templateType: 'avl_unit',
      },
      from,
      to,
      false,
    );
  }

  async getStoredData(
    unitId?: number,
    from?: string,
    to?: string,
  ): Promise<UnitEngineHours[]> {
    const query = this.engineHoursRepo
      .createQueryBuilder('report')
      .leftJoinAndSelect('report.unit', 'unit')
      .orderBy('report.time_begin', 'DESC');

    if (unitId) query.andWhere('report.unit_id = :unitId', { unitId });

    if (!from) {
      const date = new Date();
      date.setDate(date.getDate() - 30);
      from = date.toISOString().split('T')[0];
    }

    query.andWhere('report.time_begin >= :from', { from: new Date(from) });
    if (to) query.andWhere('report.time_end <= :to', { to: new Date(to) });

    return await query.getMany();
  }

  // ===========================================================================
  // ⏰ AUTOMATED CRON JOB (30 Days Sync)
  // ===========================================================================

  @Cron('*/30 * * * *')
  async dailySync() {
    if (this.isSyncRunning) return;
    this.isSyncRunning = true;
    this.logger.log('🚀 Starting Wialon Sync...');

    try {
      const sid = await this.getValidSession();
      const reportConfigs = await this.getReportConfigurations(sid);
      const units = await this.getUnits(sid);

      const to = Math.floor(Date.now() / 1000);
      const from = to - 30 * 24 * 60 * 60; // 30 Days back

      for (const unit of units) {
        for (const config of reportConfigs) {
          await this.processUnitReport(sid, unit, config, from, to, true);
        }
      }
      this.logger.log('✅ Sync Completed.');
    } catch (error) {
      this.logger.error('Sync Failed', error);
    } finally {
      this.isSyncRunning = false;
    }
  }

  // ===========================================================================
  // 🔄 BATCH / MERGE EXECUTION
  // ===========================================================================

  async executeBatchReports(dto: ExecuteReportDto): Promise<any> {
    const sid = await this.getValidSession();

    // Default 30 days calculation
    const to = dto.to || Math.floor(Date.now() / 1000);
    const from = dto.from || to - 30 * 24 * 60 * 60;

    // Determine which templates to run
    const templatesToRun =
      dto.templateIds || (dto.templateId ? [dto.templateId] : []);

    if (templatesToRun.length === 0) {
      return { message: 'No template IDs provided' };
    }

    this.logger.log(
      `🔀 Merging Reports: Templates [${templatesToRun.join(', ')}] for Unit ${dto.objectId}`,
    );

    // 👇 FIXED: Explicit types added here to prevent 'never' error
    const mergedStats: any[] = [];
    const mergedTables: any[] = [];
    let unitName = 'Unknown';

    // Run sequentially to protect the session
    for (const tId of templatesToRun) {
      const result = await this.processUnitReport(
        sid,
        { id: dto.objectId, name: 'Merge Run' },
        {
          resourceId: dto.resourceId,
          templateId: tId,
          name: `Template ${tId}`,
          templateType: 'avl_unit',
        },
        from,
        to,
        false,
      );

      if (result && !result.error && !result.message) {
        if (result.unit) unitName = result.unit;

        // Merge Stats
        if (result.stats && Array.isArray(result.stats)) {
          mergedStats.push(...result.stats);
        }

        // Merge Tables
        if (result.tables && Array.isArray(result.tables)) {
          const labeledTables = result.tables.map((t: any) => ({
            ...t,
            sourceTemplateId: tId,
          }));
          mergedTables.push(...labeledTables);
        }
      }
    }

    return {
      unit: unitName,
      reportType: 'Merged Report',
      dateRange: { from: new Date(from * 1000), to: new Date(to * 1000) },
      stats: mergedStats,
      tables: mergedTables,
    };
  }

  // ===========================================================================
  // 🏗️ CORE LOGIC (Returns Stats + Rows)
  // ===========================================================================

  private async processUnitReport(
    sid: string,
    unit: { id: number; name: string },
    config: ReportConfig,
    from: number,
    to: number,
    saveToDb: boolean,
  ) {
    if (config.templateType && config.templateType !== 'avl_unit') {
      return {
        message: `Skipped: Template type mismatch (${config.templateType})`,
      };
    }

    try {
      await this.performRequest('report/cleanup_result', {}, sid);

      const execParams = {
        reportResourceId: config.resourceId,
        reportTemplateId: config.templateId,
        reportObjectId: unit.id,
        reportObjectSecId: 0,
        interval: { from, to, flags: 0 },
      };

      const result = await this.performRequest(
        'report/exec_report',
        execParams,
        sid,
      );
      if (result.error) throw new Error(`Wialon Error ${result.error}`);

      // 📊 CAPTURE STATS
      const stats = result.reportResult?.stats || [];

      if (!result.reportResult || !result.reportResult.tables) {
        return { message: 'No tables found', stats };
      }

      const usefulTables = result.reportResult.tables.filter(
        (t: any) => t.rows > 0,
      );
      const tablesData: any[] = [];

      for (let i = 0; i < usefulTables.length; i++) {
        const table = usefulTables[i];

        // Fetch rows with LEVEL 1 to get cell data
        const rowsResponse = await this.performRequest(
          'report/get_result_rows',
          {
            tableIndex: table.index !== undefined ? table.index : i,
            indexFrom: 0,
            indexTo: table.rows - 1,
            level: 1,
          },
          sid,
        );

        if (rowsResponse.error) {
          console.error(
            `❌ Error fetching rows for ${table.label}: ${rowsResponse.error}`,
          );
          continue;
        }

        const cleanRows = this.mapRowsToDTO(table, rowsResponse);

        if (saveToDb && table.name.includes('engine_hours')) {
          if (Array.isArray(rowsResponse) && rowsResponse.length > 0) {
            await this.saveDataToDb(unit.id, unit.name, table, rowsResponse);
          }
        }

        tablesData.push({
          tableName: table.label,
          totalRows: table.rows,
          data: cleanRows,
        });
      }

      // ✅ RETURN RICH DATA STRUCTURE
      return {
        unit: unit.name,
        report: config.name,
        dateRange: { from: new Date(from * 1000), to: new Date(to * 1000) },
        stats: stats, // <--- This is what we need to see!
        tables: tablesData,
      };
    } catch (e) {
      this.logger.error(`Error processing ${unit.name}: ${e.message}`);
      return { error: e.message };
    }
  }

  // ===========================================================================
  // 🔓 PUBLIC DATA FETCHER (Used by History Module)
  // ===========================================================================

  async fetchRawReportData(
    unit: { id: number; name: string },
    templateId: number,
    resourceId: number,
    from: number,
    to: number,
  ) {
    const sid = await this.getValidSession();

    // Reuse the internal process method but Force Save=False
    // We want the raw data back so the History Module can save it
    return await this.processUnitReport(
      sid,
      unit,
      {
        resourceId,
        templateId,
        name: 'History Sync',
        templateType: 'avl_unit',
      },
      from,
      to,
      false, // ❌ Do not save to the old EngineHours table
    );
  }

  // ===========================================================================
  // 💾 DB & HELPERS
  // ===========================================================================

  private async saveDataToDb(
    unitId: number,
    unitName: string,
    tableDef: any,
    rows: any[],
  ) {
    if (!Array.isArray(rows) || rows.length === 0) return;

    try {
      await this.unitRepo.upsert({ id: unitId, name: unitName }, ['id']);

      const entities: UnitEngineHours[] = [];
      const cols = tableDef.header_type || [];
      const getIdx = (n: string) => cols.indexOf(n);

      const idx = {
        begin: getIdx('time_begin'),
        end: getIdx('time_end'),
        dur: getIdx('duration'),
        moveUtil: getIdx('movement_utilization'),
        util: getIdx('utilization'),
        fuelBegin: getIdx('fuel_level_begin'),
        fuelEnd: getIdx('fuel_level_end'),
      };

      if (idx.begin === -1) return;

      for (const row of rows) {
        const c = row.c;
        if (!c || !c[idx.begin]) continue;

        const entity = new UnitEngineHours();
        entity.unit_id = unitId;
        const getVal = (i: number) =>
          i > -1 && c[i] ? (typeof c[i] === 'object' ? c[i].t : c[i]) : null;

        entity.time_begin = this.parseWialonDate(getVal(idx.begin));
        entity.time_end = this.parseWialonDate(getVal(idx.end));
        entity.duration_seconds = this.parseDurationToSeconds(getVal(idx.dur));
        entity.movement_utilization_percent = this.parseCleanNumber(
          getVal(idx.moveUtil),
        );
        entity.utilization_percent = this.parseCleanNumber(getVal(idx.util));
        entity.fuel_level_begin = this.parseCleanNumber(getVal(idx.fuelBegin));
        entity.fuel_level_end = this.parseCleanNumber(getVal(idx.fuelEnd));

        entities.push(entity);
      }

      if (entities.length > 0) {
        await this.engineHoursRepo.upsert(entities, {
          conflictPaths: ['unit_id', 'time_begin'],
          skipUpdateIfNoValuesChanged: true,
        });
      }
    } catch (dbError) {
      this.logger.error(`DB Save Failed`, dbError.message);
    }
  }

  private async getReportConfigurations(sid: string): Promise<ReportConfig[]> {
    if (this.cachedReportConfigs.length > 0) return this.cachedReportConfigs;
    const items = await this.performRequest(
      'core/search_items',
      {
        spec: {
          itemsType: 'avl_resource',
          propName: 'sys_name',
          propValueMask: '*',
          sortType: 'sys_name',
        },
        force: 1,
        flags: 8193,
        from: 0,
        to: 0,
      },
      sid,
    );

    if (!items.items) return [];
    const configs: ReportConfig[] = [];
    for (const res of items.items) {
      if (res.rep) {
        Object.values(res.rep).forEach((t: any) => {
          if (this.TARGET_REPORT_NAMES.includes(t.n)) {
            configs.push({
              name: t.n,
              resourceId: res.id,
              templateId: t.id,
              templateType: t.ct,
            });
          }
        });
      }
    }
    this.cachedReportConfigs = configs;
    return configs;
  }

  private async getValidSession(): Promise<string> {
    if (this.currentSessionId) return this.currentSessionId;
    const data = await this.performRequest(
      'token/login',
      { token: this.apiToken },
      '',
    );
    if (data.eid) {
      this.currentSessionId = data.eid;
      return data.eid;
    }
    throw new Error('Auth Failed');
  }

  private async performRequest(svc: string, params: any, sid: string) {
    const urlParams = new URLSearchParams();
    urlParams.append('svc', svc);
    urlParams.append('params', JSON.stringify(params));
    if (sid) urlParams.append('sid', sid);
    try {
      const { data } = await firstValueFrom(
        this.httpService.post(
          `${this.wialonBaseUrl}/wialon/ajax.html`,
          urlParams,
        ),
      );
      if (data.error) {
        if (data.error === 1 && svc !== 'token/login') {
          this.currentSessionId = null;
          return this.performRequest(svc, params, await this.getValidSession());
        }
        return data;
      }
      return data;
    } catch (e) {
      throw e;
    }
  }

  private transformTemplatesResponse(data: any): ReportTemplateDTO[] {
    const templates: ReportTemplateDTO[] = [];
    if (data.items) {
      for (const res of data.items) {
        if (res.rep) {
          Object.values(res.rep).forEach((t: any) => {
            templates.push({
              templateId: t.id,
              templateName: t.n,
              templateType: t.ct,
              resourceId: res.id,
              resourceName: res.nm,
            });
          });
        }
      }
    }
    return templates;
  }

  private mapRowsToDTO(tableDef: any, rows: any[]): any[] {
    if (!rows || !Array.isArray(rows)) return [];
    const keys = tableDef.header_type || tableDef.header;
    return rows.map((row) => {
      const rowObj: any = {};
      if (row.c) {
        row.c.forEach((cell: any, i: number) => {
          rowObj[keys[i] || `col_${i}`] =
            typeof cell === 'object' && cell !== null ? cell.t : cell;
        });
      }
      return rowObj;
    });
  }

  private parseWialonDate(dateStr: string | number): Date {
    if (typeof dateStr === 'number') return new Date(dateStr * 1000);
    if (!dateStr || typeof dateStr !== 'string') return new Date();
    const [d, t] = dateStr.split(' ');
    if (!d || !t) return new Date();
    const [day, month, year] = d.split('.');
    return new Date(`${year}-${month}-${day}T${t}`);
  }

  private parseDurationToSeconds(val: string | number): number {
    if (typeof val === 'number') return val;
    if (!val) return 0;
    let days = 0,
      timeStr = val;
    if (val.includes('days')) {
      const p = val.split(' days ');
      days = parseInt(p[0], 10);
      timeStr = p[1];
    }
    const [h, m, s] = timeStr.split(':').map(Number);
    return days * 86400 + h * 3600 + m * 60 + s;
  }

  private parseCleanNumber(val: string | number): number {
    if (typeof val === 'number') return val;
    if (!val) return 0;
    return parseFloat(val.replace(/[^\d.-]/g, '')) || 0;
  }
}
