import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { UserRole } from '../entities/role.entity';

export class CreateRoleDto {
  @IsString({ message: 'name must be a string' })
  @IsNotEmpty({ message: 'name is required' })
  @IsEnum(UserRole, {
    message: 'name must be one of the following values: admin, editor, ghost',
  })
  role_name: UserRole;

  @IsString({ message: 'description must be a string' })
  @IsNotEmpty({ message: 'description is required' })
  role_description: string;
}
