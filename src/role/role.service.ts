import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Role } from './entities/role.entity';
import { Repository } from 'typeorm';

@Injectable()
export class RoleService {
  constructor(
    @InjectRepository(Role) private roleRepository: Repository<Role>,
  ) {}
  async create(createRoleDto: CreateRoleDto): Promise<Role> {
    const newRole = this.roleRepository.create({
      role_name: createRoleDto.role_name,
      role_description: createRoleDto.role_description,
    });
    return this.roleRepository.save(newRole);
  }

  async findAll(): Promise<Role[]> {
    const roles = this.roleRepository.find();
    return roles;
  }

  async findOne(id: number): Promise<Role> {
    const singleRole = await this.roleRepository.findOneBy({ id });
    if (!singleRole) {
      throw new NotFoundException(`Role with ID ${id} not found`);
    }
    return singleRole;
  }

  async update(updateRoleDto: UpdateRoleDto): Promise<Role> {
    const roleToUpdate = await this.findOne(updateRoleDto.id);
    if (!roleToUpdate) {
      throw new NotFoundException(`Role with ID ${updateRoleDto.id} not found`);
    }
    if (updateRoleDto.role_name) {
      roleToUpdate.role_name = updateRoleDto.role_name;
    }
    if (updateRoleDto.role_description) {
      roleToUpdate.role_description = updateRoleDto.role_description;
    }
    return this.roleRepository.save(roleToUpdate);
  }

  async remove(id: number): Promise<Role> {
    const roleToDelete = await this.findOne(id);
    if (!roleToDelete) {
      throw new NotFoundException(`Role with ID ${id} not found`);
    }
    return this.roleRepository.remove(roleToDelete);
  }
}
