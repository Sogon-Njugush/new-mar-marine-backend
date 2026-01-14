import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { RoleService } from './role.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { RoleExistsPipe } from './pipe/role-exits.pipe';
import { Role, UserRole } from './entities/role.entity';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { Roles } from 'src/auth/decorators/roles.decorators';
import { RolesGuard } from 'src/auth/guards/roles-guard';

@Controller('role')
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @Roles(UserRole.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post()
  create(@Body() createRoleDto: CreateRoleDto): Promise<Role> {
    return this.roleService.create(createRoleDto);
  }

  @Get()
  async findAll(): Promise<Role[]> {
    return this.roleService.findAll();
  }

  @Get(':id')
  async findOne(
    @Param('id', ParseIntPipe, RoleExistsPipe) id: number,
  ): Promise<Role> {
    return this.roleService.findOne(+id);
  }

  @Patch()
  async update(
    // @Param('id', ParseIntPipe, RoleExistsPipe) id: number,
    @Body() updateRoleDto: UpdateRoleDto,
  ): Promise<Role> {
    return this.roleService.update(updateRoleDto);
  }

  @Delete(':id')
  async remove(
    @Param('id', ParseIntPipe, RoleExistsPipe) id: number,
  ): Promise<Role> {
    return this.roleService.remove(id);
  }
}
