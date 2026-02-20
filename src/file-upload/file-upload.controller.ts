import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileUploadService } from './file-upload.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadFilteDto } from './dto/upload-file.dto';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { type CurrentUserType } from 'src/auth/types/current-user.type';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UserRole } from 'src/auth/entities/user.entity';
import { RolesGuard } from 'src/auth/guards/roles.guard';

@Controller('file-upload')
export class FileUploadController {
  constructor(private readonly fileUploadService: FileUploadService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body() uploadFileDto: UploadFilteDto,
    @CurrentUser() user: CurrentUserType,
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }
    return this.fileUploadService.uploadFile(
      file,
      uploadFileDto.description,
      user,
    );
  }

  @Get()
  @Roles(UserRole.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async findAll() {
    return this.fileUploadService.findAll();
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: CurrentUserType,
  ) {
    await this.fileUploadService.remove(id, user);
    return {
      message: 'File deleted successfully',
    };
  }
}
