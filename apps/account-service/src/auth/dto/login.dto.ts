import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: '유효한 이메일 형식을 입력하세요' })
  @IsNotEmpty({ message: '이메일은 필수 입력 항목입니다' })
  email: string;

  @IsString()
  @IsNotEmpty({ message: '비밀번호는 필수 입력 항목입니다' })
  password: string;
}
