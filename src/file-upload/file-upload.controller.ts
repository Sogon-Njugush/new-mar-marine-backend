import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileUploadService } from './file-upload.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadFileDto } from './dto/upload-file.dto';
import { Roles } from 'src/auth/decorators/roles.decorators';
import { UserRole } from 'src/role/entities/role.entity';
import { RolesGuard } from 'src/auth/guards/roles-guard';

@Controller('file-upload')
export class FileUploadController {
  constructor(private readonly fileUploadService: FileUploadService) {}
  @Post()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @Body() uploadFileDto: UploadFileDto,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<any> {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    return await this.fileUploadService.uploadFile(
      file,
      uploadFileDto.description,
    );
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async findAll() {
    return await this.fileUploadService.findAll();
  }

  @Delete(':id')
  @Roles(UserRole.EDITOR)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async removeFile(@Param('id') id: string) {
    return await this.fileUploadService.removeFile(id);
  }
}
