import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileUploadService } from './file-upload.service';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('upload')
export class FileUploadController {
  constructor(private readonly fileUploadService: FileUploadService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    if (this.fileUploadService.isPackageJson(file)) {
      return {
        type: 'package.json',
        valid: true,
        message: 'package.json 파일입니다.',
      };
    } else {
      return {
        type: 'other',
        valid: false,
        message: '잘못된 형식의 파일입니다.',
      };
    }
  }
}
