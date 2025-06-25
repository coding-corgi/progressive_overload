// apps/account-service/src/auth/guards/jwt-auth.guard.ts

import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    console.log('--- 1. JwtAuthGuard: canActivate 시작 ---');
    // 여기서 토큰 존재 여부, 형식 등을 미리 확인할 수 있습니다.
    const request = context.switchToHttp().getRequest();
    console.log('Request Headers:', request.headers.authorization);

    return super.canActivate(context);
  }

  handleRequest(err, user, info) {
    console.log('--- 2. JwtAuthGuard: handleRequest 시작 ---');
    console.log('Error:', err);
    console.log('User:', user);
    console.log('Info:', info);

    // 에러가 있거나 유저 정보가 없으면 예외를 던집니다.
    if (err || !user) {
      console.log('--- 3. 인증 실패! 예외 발생 ---');
      throw err || new Error(info?.message || 'Unauthorized');
    }

    console.log('--- 4. 인증 성공! 유저 정보 반환 ---');
    return user;
  }
}
