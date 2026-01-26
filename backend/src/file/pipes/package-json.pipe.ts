import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

@Injectable()
export class PackageJsonPipe implements PipeTransform<Express.Multer.File> {
  private readonly MAX_FILE_SIZE = 5 * 1024 * 1024;

  async transform(
    file: Express.Multer.File,
    p0: any,
  ): Promise<Express.Multer.File> {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    if (file.size > this.MAX_FILE_SIZE) {
      throw new BadRequestException('File size exceeds 5MB limit');
    }

    if (file.mimetype !== 'application/json') {
      throw new BadRequestException('File must be in JSON format');
    }

    try {
      const content = file.buffer.toString('utf-8').replace(/^\uFEFF/, '');

      const json = JSON.parse(content, (key, value) => {
        if (['__proto__', 'constructor', 'prototype'].includes(key)) {
          return undefined;
        }
        return value;
      });

      if (typeof json !== 'object' || json == null || Array.isArray(json)) {
        throw new BadRequestException('File must contain a JSON object');
      }
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Invalid JSON format');
    }
    return file;
  }
}
