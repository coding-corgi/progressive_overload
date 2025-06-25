import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [UsersModule], // UsersModule을 임포트하여 사용자 관련 기능 사용
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
