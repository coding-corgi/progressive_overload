import { Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy, StrategyOptions } from 'passport-jwt';
import { UsersService } from '../../users/users.service';
import { Request } from 'express';
import { TokenPayload } from '../interfaces/token-payload.interface';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(
    configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    const secret = configService.get<string>('JWT_REFRESH_TOKEN_SECRET_KEY');
    if (!secret) {
      throw new InternalServerErrorException('JWT_REFRESH_TOKEN_SECRET_KEY 환경 변수가 설정되어 있지 않습니다.');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: secret,
      passReqToCallback: true,
      ignoreExpiration: false,
    });
  }

  async validate(req: Request, payload: TokenPayload) {
    const authorization = req.headers.authorization;
    if (!authorization) {
      throw new UnauthorizedException('Authorization header가 없습니다.');
    }
    const refreshToken = authorization.split(' ')[1];
    const user = await this.usersService.getUserByRefreshToken(refreshToken, payload.sub);

    if (!user) {
      throw new UnauthorizedException(' 리프레쉬 토큰이 유효하지 않습니다.');
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
}
