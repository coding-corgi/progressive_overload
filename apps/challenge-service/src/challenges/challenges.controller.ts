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
    private readonly challengsLogsService: ChallengeLogsService,
  ) {}

  @ApiOperation({ summary: '챌린지 생성 API' })
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createChallengeDto: CreateChallengeDto) {
    return this.challengeService.create(createChallengeDto);
  }

  @ApiOperation({ summary: '챌린지 전체 조회 API' })
  @Get()
  async findAll() {
    return await this.challengeService.findAll();
  }

  @ApiOperation({ summary: '챌린지 상세 조회 API' })
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return await this.challengeService.findOne(+id);
  }

  @ApiOperation({ summary: '챌린지 수정 API' })
  @Patch(':id')
  async update(@Param('id', ParseIntPipe) id: number, @Body() updateChallengeDto: UpdateChallengeDto) {
    return this.challengeService.update(+id, updateChallengeDto);
  }

  @ApiOperation({ summary: '챌린지 삭제 API' })
  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.challengeService.remove(+id);
  }

  @Get('logs/:userId')
  @ApiOperation({ summary: '챌린지 생성 로그 조회 API' })
  async getChallengeLogs(@Param('userId') userId: string, @Query('count') count?: string) {
    const logs = await this.challengsLogsService.getRecentChallengesLogs(userId, count ? parseInt(count) : 10);
    return {
      userId,
      logs: logs.map((log) => {
        return {
          challengeId: log.id,
          createdAt: typeof log.createdAt === 'string' ? log.createdAt : log.createdAt.toISOString(),
        };
      }),
    };
  }
}
