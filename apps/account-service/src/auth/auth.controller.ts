import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { User } from '../users/entities/user.entity';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: '로그인' })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('refresh')
  @ApiOperation({ summary: '액세스 토큰 재발급 (리프레시 토큰 사용)' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt-refresh'))
  refreshTokens(@Req() req: Request & { user: User }) {
    return this.authService.refreshTokens(req.user);
  }

  @Post('logout')
  @ApiOperation({ summary: '로그아웃 (리프레시 토큰 제거)' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  async logout(@Req() req: Request & { user: User }) {
    return await this.authService.logout(req.user);
  }
}
