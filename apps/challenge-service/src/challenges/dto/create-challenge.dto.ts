import { IsDateString, IsNumber, IsString } from 'class-validator';

export class CreateChallengeDto {
  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsDateString()
  startDate: Date;

  @IsDateString()
  endDate: Date;

  @IsNumber()
  userId: number;
}
