import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CloudinaryService } from './cloudinary/cloudinary.service';
import { CurrentUserType } from 'src/auth/types/current-user.type';
import { File } from './entities/file.entity';
import { UserRole } from 'src/auth/entities/user.entity';

@Injectable()
export class FileUploadService {
  constructor(
    @InjectRepository(File)
    private readonly fileRepositoty: Repository<File>,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  async uploadFile(
    file: Express.Multer.File,
    description: string | undefined,
    user: CurrentUserType,
  ) {
    const cloudinaryResponse = await this.cloudinaryService.uploadFile(file);

    const createdFile = this.fileRepositoty.create({
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      publicId: cloudinaryResponse.public_id,
      url: cloudinaryResponse.secure_url,
      description,
      user: {
        id: user.id,
      },
    });

    return this.fileRepositoty.save(createdFile);
  }

  async findAll() {
    return this.fileRepositoty.find({
      relations: ['user'],
      order: { createAt: 'DESC' },
    });
  }

  async remove(id: string, user: CurrentUserType) {
    const fileToBeDeleted = await this.fileRepositoty.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!fileToBeDeleted) {
      throw new NotFoundException(`File with id ${id} was not found!`);
    }

    if (fileToBeDeleted.user.id !== user.id && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('You can only delete your own files.');
    }

    await this.cloudinaryService.deleteFile(id);

    await this.fileRepositoty.remove(fileToBeDeleted);
  }
}
