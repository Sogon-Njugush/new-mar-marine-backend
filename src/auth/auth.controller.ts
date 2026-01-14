import { ref } from 'process';
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseIntPipe,
  Put,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateAuthDto } from './dto/create-auth.dto';
import { UpdateAuthDto } from './dto/update-auth.dto';
import { Auth } from './entities/auth.entity';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current_user.decorators';
import { Roles } from './decorators/roles.decorators';
import { Role, UserRole } from 'src/role/entities/role.entity';
import { RolesGuard } from './guards/roles-guard';
import { LoginThrottlerGuard } from './guards/login-throttler.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post()
  async create(
    @Body() createAuthDto: CreateAuthDto,
  ): Promise<{ user: Partial<Auth> }> {
    return this.authService.create(createAuthDto);
  }
  @UseGuards(LoginThrottlerGuard)
  @Post('login')
  login(@Body() LoginDto: LoginDto) {
    return this.authService.login(LoginDto);
  }

  @Post('refresh-token')
  refreshToken(@Body('refreshToken') refreshToken: string) {
    return this.authService.refreshToken(refreshToken);
  }

  @UseGuards(JwtAuthGuard)
  @Get('current-user')
  getCurrentUser(@CurrentUser() user: Auth) {
    return user;
  }

  @Roles(UserRole.EDITOR)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get()
  async findAll() {
    return this.authService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.authService.getUserById(id);
  }

  @Roles(UserRole.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Put()
  update(@Body() updateAuthDto: UpdateAuthDto) {
    return this.authService.update(updateAuthDto);
  }

  @Roles(UserRole.GHOST)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.authService.remove(id);
  }
}
