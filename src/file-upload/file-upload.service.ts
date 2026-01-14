import { Injectable, NotFoundException } from '@nestjs/common';
import { CloudinaryService } from './cloudinary/cloudinary.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { File } from './entities/file.entity';

@Injectable()
export class FileUploadService {
  constructor(
    private readonly cloudinaryService: CloudinaryService,
    @InjectRepository(File)
    private readonly fileRepository: Repository<File>,
  ) {}

  async uploadFile(
    file: Express.Multer.File,
    description: string | undefined,
  ): Promise<File> {
    const cloudinaryResponse = await this.cloudinaryService.uploadFile(file);
    const newlyCreatedFile = this.fileRepository.create({
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      url: cloudinaryResponse.secure_url,
      publicId: cloudinaryResponse.public_id,
      description,
    });
    return this.fileRepository.save(newlyCreatedFile);
  }

  async findAll(): Promise<File[]> {
    return this.fileRepository.find({
      order: {
        createdAt: 'DESC',
      },
    });
  }

  async removeFile(id: string): Promise<any> {
    const fileToDelete = await this.fileRepository.findOne({
      where: { id: id },
    });
    if (!fileToDelete) {
      throw new NotFoundException(`File with ID ${id} not found`);
    }
    //delete from cloudinary

    await this.cloudinaryService.removeFile(fileToDelete.publicId);
    //delete from database
    await this.fileRepository.remove(fileToDelete);
    return fileToDelete;
  }
}
