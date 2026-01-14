import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { WialonService, ReportTemplateDTO } from './wialon.service';
import { ExecuteReportDto } from './dto/execute-report.dto';

@Controller('wialon')
export class WialonController {
  constructor(private readonly wialonService: WialonService) {}

  @Get('units')
  async getUnits() {
    return this.wialonService.getUnits();
  }

  @Get('reports/templates')
  async getTemplates(): Promise<ReportTemplateDTO[]> {
    return this.wialonService.getAllReportTemplates();
  }

  @Get('form-data')
  async getReportFormData() {
    // Run parallel requests for faster loading
    const [templates, units] = await Promise.all([
      this.wialonService.getAllReportTemplates(),
      this.wialonService.getUnits(),
    ]);

    return {
      units, // List of { id, name }
      templates, // List of valid templates
    };
  }

  // ---------------------------------------------------------
  // 2. Manual Execution (Live from Wialon)
  // ---------------------------------------------------------

  // @Post('reports/execute')
  // async executeReport(@Body() body: ExecuteReportDto) {
  //   // This runs the report live on Wialon and returns the result immediately
  //   // It does NOT save to the database (as per service configuration)
  //   return this.wialonService.executeReport(body);
  // }

  @Post('reports/execute')
  async executeReport(@Body() body: ExecuteReportDto) {
    // If array is present, use batch logic. Otherwise use single logic.
    if (body.templateIds && body.templateIds.length > 0) {
      return this.wialonService.executeBatchReports(body);
    }
    return this.wialonService.executeReport(body);
  }

  // ---------------------------------------------------------
  // 3. Database Retrieval (Stored Data)
  // ---------------------------------------------------------

  @Get('reports/data')
  async getStoredData(
    @Query('unitId') unitId?: string,
    @Query('from') from?: string, // Format: YYYY-MM-DD
    @Query('to') to?: string, // Format: YYYY-MM-DD
  ) {
    // Fetch data from local Postgres
    // Defaults to last 30 days if dates are missing
    return this.wialonService.getStoredData(
      unitId ? parseInt(unitId) : undefined,
      from,
      to,
    );
  }
}
