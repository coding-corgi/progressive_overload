export interface TokenPayload {
  sub: number; // JWT subject: 사용자 고유 ID
  email: string; // JWT에 포함된 사용자 이메일
}
