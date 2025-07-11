import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { ChallengeService } from './challenges.service';
import { CreateChallengeDto } from './dto/create-challenge.dto';
import { UpdateChallengeDto } from './dto/update-challenge.dto';
import { ChallengeLogsService } from '../redis/challenges.redis';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('challenges')
@Controller('challenges')
export class ChallengeController {
  constructor(
    private readonly challengeService: ChallengeService,
    private readonly challengeLogsService: ChallengeLogsService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '챌린지 생성' })
  async create(@Body() dto: CreateChallengeDto) {
    return this.challengeService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: '챌린지 전체 조회' })
  async findAll() {
    return await this.challengeService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: '챌린지 상세 조회' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return await this.challengeService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: '챌린지 수정' })
  async update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateChallengeDto) {
    return this.challengeService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '챌린지 삭제' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.challengeService.remove(id);
  }

  @Get('logs/:userId')
  @ApiOperation({ summary: '챌린지 생성 로그 조회' })
  async getChallengeLogs(@Param('userId') userId: string, @Query('count') count?: string) {
    const logs = await this.challengeLogsService.getRecentChallengesLogs(userId, count ? parseInt(count) : 10);

    return {
      userId,
      logs: logs.map((log) => ({
        challengeId: log.id,
        createdAt: typeof log.createdAt === 'string' ? log.createdAt : log.createdAt.toISOString(),
      })),
    };
  }
}
