import { PartialType } from '@nestjs/mapped-types';
import { CreateRoleDto } from './create-role.dto';
import { IsInt, IsNotEmpty } from 'class-validator';

export class UpdateRoleDto extends PartialType(CreateRoleDto) {
  @IsInt({ message: 'id must be an integer' })
  @IsNotEmpty({ message: 'id is required' })
  id: number;
}
