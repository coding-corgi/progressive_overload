import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ description: '사용자의 이메일 주소' })
  @IsEmail({}, { message: '유효한 이메일 형식을 입력하세요' })
  email: string;

  @ApiProperty({ description: '사용자의 이름', minLength: 2 })
  @IsString()
  @MinLength(2, { message: '이름은 최소 2글자 이상이어야 합니다' })
  name: string;

  @ApiProperty({ description: '사용자의 비밀번호', minLength: 8 })
  @IsString()
  @MinLength(8, { message: '비밀번호는 최소 8글자 이상이어야 합니다' })
  password: string;
}
