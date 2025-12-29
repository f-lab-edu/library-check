import { UsersService } from './../users/users.service';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/auth.dto';
import { LoginResponse } from './types/login-response.type';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto): Promise<LoginResponse> {
    const { email, password } = loginDto;

    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('이메일 또는 비밀번호가 잘못되었습니다.');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('이메일 또는 비밀번호가 잘못되었습니다.');
    }
    if (password.length < 8) {
      throw new UnauthorizedException('비밀번호가 너무 짧습니다.');
    }

    const payload = { sub: user.id, email: user.email };

    const access_token = await this.jwtService.signAsync(payload);

    return {
      access_token,
      user: {
        id: user.id,
        email: user.email,
        nickname: user.nickname,
      },
    };
  }
}
