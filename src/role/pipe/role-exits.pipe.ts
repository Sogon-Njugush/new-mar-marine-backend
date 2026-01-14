import {
  ArgumentMetadata,
  Injectable,
  NotFoundException,
  PipeTransform,
} from '@nestjs/common';
import { RoleService } from '../role.service';

@Injectable()
export class RoleExistsPipe implements PipeTransform {
  constructor(private readonly roleService: RoleService) {}
  async transform(value: any, metadata: ArgumentMetadata) {
    try {
      await this.roleService.findOne(value);
    } catch (error) {
      throw new NotFoundException(`Role with ID ${value} not found`);
    }
    return value;
  }
}
