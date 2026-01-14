import { Inject, Injectable } from '@nestjs/common';
import { UploadApiResponse } from 'cloudinary';
import * as streamifier from 'streamifier';

@Injectable()
export class CloudinaryService {
  constructor(@Inject('CLOUDINARY') private readonly cloudinary: any) {}

  uploadFile(file: Express.Multer.File): Promise<UploadApiResponse> {
    return new Promise<UploadApiResponse>((resolve, reject) => {
      const uploadStream = this.cloudinary.uploader.upload_stream(
        {
          folder: 'youTube-posts',
          resource_type: 'auto',
          chunk_size: 6000000,
        },
        (error: UploadApiResponse, result: UploadApiResponse) => {
          if (error) {
            reject(error);
          } else {
            resolve(result);
          }
        },
      );
      //convert buffer to a readable stream and then pipe to upload stream
      streamifier.createReadStream(file.buffer).pipe(uploadStream);
    });
  }

  async removeFile(publicId: string): Promise<any> {
    return this.cloudinary.uploader.destroy(publicId);
  }
}
