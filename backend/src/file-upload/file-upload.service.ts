import { Injectable } from '@nestjs/common';

@Injectable()
export class FileUploadService {
  isPackageJson(file): boolean {
    if (!this.isJsonExtension(file)) {
      return false;
    }

    if (!this.isPackageJsonFileName(file)) {
      return false;
    }

    const json = this.parseJson(file);
    if (!json) {
      return false;
    }

    return this.hasDependencies(json);
  }

  private isJsonExtension(file): boolean {
    return file.originalname.endsWith('.json');
  }

  // 다른 의존성 파일도 추가 예정
  private isPackageJsonFileName(file): boolean {
    return file.originalname === 'package.json';
  }

  private parseJson(file): any | null {
    try {
      const content = file.buffer.toString('utf-8');
      return JSON.parse(content);
    } catch (error) {
      return null;
    }
  }

  private hasDependencies(json): boolean {
    if (!json) {
      return false;
    }

    return (
      json.hasOwnProperty('dependencies') ||
      json.hasOwnProperty('devDependencies')
    );
  }
}
