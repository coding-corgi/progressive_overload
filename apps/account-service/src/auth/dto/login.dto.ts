import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'user@example.com', description: '사용자의 이메일 주소', required: true })
  @IsEmail({}, { message: '유효한 이메일 형식을 입력하세요' })
  @IsNotEmpty({ message: '이메일은 필수 입력 항목입니다' })
  email: string;

  @ApiProperty({ description: '사용자의 비밀번호' })
  @IsString()
  @IsNotEmpty({ message: '비밀번호는 필수 입력 항목입니다' })
  password: string;
}
