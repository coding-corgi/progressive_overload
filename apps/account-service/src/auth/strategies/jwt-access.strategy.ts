import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service';
import { TokenPayload } from '../interfaces/token-payload.interface';

@Injectable() // JWT 전략을 구현하는 클래스
export class JwtStrategy extends PassportStrategy(Strategy) {
  // Passport의 Strategy 클래스를 확장하여 JWT 인증을 처리

  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    const secret = configService.get<string>('JWT_ACCESS_TOKEN_SECRET_KEY');
    if (!secret) {
      throw new Error('JWT_SECRET 환경 변수가 설정되어 있지 않습니다.');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), // JWT를 Bearer 토큰으로부터 추출
      ignoreExpiration: false, // 만료된 토큰을 거부 결정
      secretOrKey: secret,
    });
  }

  async validate(payload: TokenPayload) {
    const user = await this.usersService.findOneById(Number(payload.sub));
    if (!user) {
      throw new UnauthorizedException('사용자를 찾을 수 없습니다.');
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
}
