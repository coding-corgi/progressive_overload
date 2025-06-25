import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService, // UsersService를 주입하여 사용자 관련 기능을 사용
    private readonly jwtService: JwtService, // JWT 서비스 주입
  ) {}

  async login(loginDto: LoginDto): Promise<{ accessToken: string }> {
    const user = await this.usersService.findOneByEmail(loginDto.email);

    if (!user) {
      throw new Error('사용자를 찾을 수 없습니다.');
    }

    if (!(await bcrypt.compare(loginDto.password, user.password))) {
      throw new UnauthorizedException(`비밀번호가 잘못되었습니다.`);
    }

    const payload = { email: user.email, sub: String(user.id) };

    return {
      accessToken: this.jwtService.sign(payload), // JWT 토큰 생성
    };
  }

  // async logout(): Promise<any> {
  //   // 로그아웃 로직을 여기에 구현합니다.
  //   return { message: '로그아웃 성공' };
  // }
}
