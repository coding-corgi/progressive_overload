import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtStrategy } from './strategies/jwt.strategy';
import { PassportModule } from '@nestjs/passport';

@Module({
  imports: [
    UsersModule, // UsersModule을 임포트하여 사용자 관련 기능 사용
    PassportModule.register({ defaultStrategy: 'jwt' }), // Passport 모듈을 등록하고 기본 전략을 JWT로 설정
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET_KEY'), // JWT 비밀 키를 환경 변수에서 가져옴
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRATION') || '1h',
        }, // 토큰 만료 시간 설정
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy, // JWT 모듈을 프로바이더로 등록
  ],
})
export class AuthModule {}
