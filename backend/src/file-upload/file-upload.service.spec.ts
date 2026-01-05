import { Test, TestingModule } from '@nestjs/testing';
import { FileUploadService } from './file-upload.service';
import { Express } from 'express';
import { Readable } from 'stream';

const createEmptyStream = (): Readable => {
  const stream = new Readable();
  stream.push(null);
  return stream;
};

export const createMockFile = (
  originalname: string,
  content: string,
): Express.Multer.File => ({
  originalname,
  buffer: Buffer.from(content),
  size: Buffer.from(content).length,
  fieldname: 'file',
  encoding: '7bit',
  mimetype: 'application/json',
  destination: '',
  filename: originalname,
  path: `/tmp/${originalname}`,
  stream: createEmptyStream(),
});

describe('FileUploadService', () => {
  let service: FileUploadService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FileUploadService],
    }).compile();

    service = module.get<FileUploadService>(FileUploadService);
  });

  describe('isJsonExtension_true', () => {
    it('should return true for .json', () => {
      const file = createMockFile('package.json', '{}');
      expect(service['isJsonExtension'](file)).toBe(true);
    });

    it('should return false for non-json file', () => {
      const file = createMockFile('package.js', 'dependencies {}');
      expect(service['isJsonExtension'](file)).toBe(false);
    });
  });

  // 다른 의존성 파일 추가 시 변경
  describe('isPackageJsonFileName', () => {
    it('should return true for package.json', () => {
      const file = createMockFile('package.json', '{}');
      expect(service['isPackageJsonFileName'](file)).toBe(true);
    });

    it('should return false for package-lock.json', () => {
      const file = createMockFile('package-lock.json', '{}');
      expect(service['isPackageJsonFileName'](file)).toBe(false);
    });
  });

  describe('parseJson', () => {
    it('should return parsed object for valid JSON', () => {
      const file = createMockFile('package.json', '{"name": "test"}');
      const result = service['parseJson'](file);
      expect(result).toEqual({ name: 'test' });
    });

    it('should return null for invalid JSON', () => {
      const file = createMockFile('package.json', '{"name": "test"');
      const result = service['parseJson'](file);
      expect(result).toBeNull();
    });
  });

  describe('hasDependencies', () => {
    it('should return true if dependencies exists', () => {
      const json = { dependencies: { express: '4.18.2' } };
      expect(service['hasDependencies'](json)).toBe(true);
    });

    it('should return true if devDependencies exists', () => {
      const json = { devDependencies: { '@types/express': '4.17.17' } };
      expect(service['hasDependencies'](json)).toBe(true);
    });

    it('should return true if both dependencies and devDependencies exist', () => {
      const json = {
        dependencies: { express: '4.18.2' },
        devDependencies: { '@types/express': '4.17.17' },
      };
      expect(service['hasDependencies'](json)).toBe(true);
    });

    it('should return false if both are missing', () => {
      const json = { name: 'test' };
      expect(service['hasDependencies'](json)).toBe(false);
    });

    it('should return false if json is null', () => {
      expect(service['hasDependencies'](null)).toBe(false);
    });

    it('should return false if json is undefined', () => {
      expect(service['hasDependencies'](undefined)).toBe(false);
    });
  });

  describe('isPackageJson', () => {
    it('should return true for package.json with dependencies only', () => {
      const file = createMockFile(
        'package.json',
        '{"dependencies": {"express": "4.18.2"}}',
      );
      expect(service.isPackageJson(file)).toBe(true);
    });

    it('should return true for package.json with devDependencies only', () => {
      const file = createMockFile(
        'package.json',
        '{"devDependencies": {"@types/express": "4.17.17"}}',
      );
      expect(service.isPackageJson(file)).toBe(true);
    });

    it('should return true for package.json with both dependencies and devDependencies', () => {
      const file = createMockFile(
        'package.json',
        '{"dependencies": {}, "devDependencies": {}}',
      );
      expect(service.isPackageJson(file)).toBe(true);
    });

    it('should return false if extension is not .json', () => {
      const file = createMockFile('package.txt', '{}');
      expect(service.isPackageJson(file)).toBe(false);
    });

    it('should return false if filename is not package.json', () => {
      const file = createMockFile('package-lock.json', '{}');
      expect(service.isPackageJson(file)).toBe(false);
    });

    it('should return false if JSON is invalid', () => {
      const file = createMockFile('package.json', '{"name": "test"');
      expect(service.isPackageJson(file)).toBe(false);
    });

    it('should return false if both dependencies and devDependencies are missing', () => {
      const file = createMockFile('package.json', '{"name": "test"}');
      expect(service.isPackageJson(file)).toBe(false);
    });
  });
});
