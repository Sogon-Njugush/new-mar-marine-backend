import {
  IsEmail,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsString,
  MinLength,
} from 'class-validator';
import { UserRole } from 'src/role/entities/role.entity';

export class CreateAuthDto {
  @IsEmail(
    {},
    {
      message: 'Email must be a valid email address',
    },
  )
  @IsNotEmpty({
    message: 'Email is required',
  })
  email: string;

  @IsString({
    message: 'Password must be a string',
  })
  @IsNotEmpty({
    message: 'Password is required',
  })
  @MinLength(6, {
    message: 'Password must be at least 6 characters long',
  })
  password: string;

  @IsString({
    message: 'Username must be a string',
  })
  @IsNotEmpty({
    message: 'Username is required',
  })
  @MinLength(3, {
    message: 'Username must be at least 3 characters long',
  })
  username: string;

  @IsInt({
    message: 'role must be an integer',
  })
  @IsNotEmpty({
    message: 'role is required',
  })
  role_id: number;
}
