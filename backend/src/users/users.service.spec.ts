import { CreateUserDto } from './dto/create-user.dto';
import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException } from '@nestjs/common';

jest.mock('bcrypt');

describe('UsersService', () => {
  let service: UsersService;
  let repository: Repository<User>;

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    repository = module.get<Repository<User>>(getRepositoryToken(User));

    jest.clearAllMocks();
  });

  describe('create', () => {
    it('회원가입 시 새로운 사용자 생성', async () => {
      const createUserDto: CreateUserDto = {
        email: 'test@example.com',
        password: 'pass1234',
        nickname: 'test',
      };

      const hashedPassword = '$2b$10$hashedPasswordValue';

      const savedUser: User = {
        id: 1,
        email: createUserDto.email,
        password: hashedPassword,
        nickname: createUserDto.nickname,
        createdAt: new Date('2025-12-25T12:00:00.000Z'),
        updatedAt: new Date('2025-12-25T12:00:00.000Z'),
      };

      mockRepository.findOne.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);
      mockRepository.create.mockReturnValue(savedUser);
      mockRepository.save.mockResolvedValue(savedUser);

      const result = await service.create(createUserDto);

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });

      expect(bcrypt.hash).toHaveBeenCalledWith('pass1234', 10);

      expect(mockRepository.create).toHaveBeenCalled();

      expect(mockRepository.save).toHaveBeenCalled();

      expect(result).toEqual(savedUser);
      expect(result.email).toBe('test@example.com');
      expect(result.password).toBe(hashedPassword);
    });

    it('email 중복 체크', async () => {
      const createUserDto: CreateUserDto = {
        email: 'test12@example.com',
        password: 'pass1234',
      };

      const existingUser: User = {
        id: 1,
        email: 'test12@example.com',
        password: 'hashed',
        nickname: '사용자1',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRepository.findOne.mockResolvedValue(existingUser);

      await expect(service.create(createUserDto)).rejects.toThrow(
        ConflictException,
      );

      await expect(service.create(createUserDto)).rejects.toThrow(
        '이미 존재하는 이메일입니다.',
      );

      expect(mockRepository.save).not.toHaveBeenCalled();
    });
  });
});
