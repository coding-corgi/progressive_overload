import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { User } from '../users/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService, // UsersService를 주입하여 사용자 관련 기능을 사용
    private readonly jwtService: JwtService, // JWT 서비스 주입
    private readonly configService: ConfigService, // ConfigService를 주입하여 환경 변수 접근
  ) {}

  async login(loginDto: LoginDto): Promise<{ accessToken: string; refreshToken: string }> {
    const user = await this.usersService.findOneByEmail(loginDto.email);

    if (!user) {
      throw new Error('사용자를 찾을 수 없습니다.');
    }

    if (!(await bcrypt.compare(loginDto.password, user.password))) {
      throw new UnauthorizedException(`비밀번호가 잘못되었습니다.`);
    }

    const payload = { email: user.email, sub: String(user.id) };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.sign(payload, {
        secret: this.configService.get<string>('JWT_ACCESS_TOKEN_SECRET_KEY'),
        expiresIn: this.configService.get<string>('JWT_ACCESS_TOKEN_EXPIRATION') || '1h',
      }),
      this.jwtService.sign(payload, {
        secret: this.configService.get<string>('JWT_REFRESH_TOKEN_SECRET_KEY'),
        expiresIn: this.configService.get<string>('JWT_REFRESH_TOKEN_EXPIRATION') || '7d',
      }),
    ]);

    await this.usersService.setCurrentHashedRefreshToken(refreshToken, user.id);

    return {
      accessToken, // JWT 액세스 토큰 반환
      refreshToken, // JWT 리프레시 토큰 반환
    };
  }

  refreshTokens(user: User) {
    const payload = { email: user.email, sub: String(user.id) };
    const newAccessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_ACCESS_TOKEN_SECRET_KEY'),
      expiresIn: this.configService.get<string>('JWT_ACCESS_TOKEN_EXPIRATION') || '1h',
    });
    return {
      accessToken: newAccessToken,
    };
  }

  async logout(user: User): Promise<{ message: string }> {
    await this.usersService.removeRefreshToken(user.id);
    return { message: '로그아웃 성공' };
  }
}
