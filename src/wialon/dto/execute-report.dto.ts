import { IsNumber, IsOptional, IsArray } from 'class-validator';

export class ExecuteReportDto {
  @IsNumber()
  resourceId: number;

  @IsOptional()
  @IsNumber()
  templateId?: number;

  @IsOptional()
  @IsArray()
  templateIds?: number[];

  @IsNumber()
  objectId: number;

  // 👇 CHANGED: Removed @IsNumber() so it accepts Strings ("2026-01-01") OR Numbers
  @IsOptional()
  from?: string | number;

  @IsOptional()
  from_time?: string;

  // 👇 CHANGED: Removed @IsNumber()
  @IsOptional()
  to?: string | number;

  @IsOptional()
  to_time?: string;
}
