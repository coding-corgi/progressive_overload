import { IsEmail, IsString, MinLength } from 'class-validator';

export class CreateUserDto {
  @IsEmail({}, { message: '유효한 이메일 형식을 입력하세요' })
  email: string;

  @IsString()
  @MinLength(2, { message: '이름은 최소 2글자 이상이어야 합니다' })
  name: string;

  @IsString()
  @MinLength(8, { message: '비밀번호는 최소 8글자 이상이어야 합니다' })
  password: string;
}
