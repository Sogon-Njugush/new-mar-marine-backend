import { IsNumber, IsOptional, IsArray } from 'class-validator';

export class ExecuteReportDto {
  @IsNumber()
  resourceId: number;

  @IsOptional()
  @IsNumber()
  templateId?: number; // Keep for backward compatibility

  // 👇 New field for merging multiple reports
  @IsOptional()
  @IsArray()
  templateIds?: number[];

  @IsNumber()
  objectId: number;

  @IsOptional()
  @IsNumber()
  from?: number;

  @IsOptional()
  @IsNumber()
  to?: number;
}
