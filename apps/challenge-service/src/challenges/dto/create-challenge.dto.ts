import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsNumber, IsString } from 'class-validator';

export class CreateChallengeDto {
  @ApiProperty({ description: '챌린지 제목' })
  @IsString()
  title: string;

  @ApiProperty({ description: '챌린지 설명' })
  @IsString()
  description: string;

  @ApiProperty({ description: '챌린지 시작 날짜', type: String, format: 'date-time' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ description: '챌린지 종료 날짜', type: String, format: 'date-time' })
  @IsDateString()
  endDate: string;

  @ApiProperty({ description: '챌린지 참여자 ID' })
  @Type(() => Number)
  @IsNumber()
  userId: number;
}
