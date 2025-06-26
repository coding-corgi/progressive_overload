import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { User } from '../users/entities/user.entity';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() loginDto: LoginDto): Promise<any> {
    return this.authService.login(loginDto);
  }

  @UseGuards(AuthGuard('jwt-refresh'))
  @Post('refresh')
  refreshTokens(@Req() req: Request & { user: User }) {
    const user = req.user;
    return this.authService.refreshTokens(user);
  }

  @Post('logout')
  @UseGuards(AuthGuard('jwt')) // JWT 인증 가드 사용
  async logout(@Req() req: Request & { user: User }) {
    const user = req.user;
    return await this.authService.logout(user);
  }
}
