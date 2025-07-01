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

@Controller('challenges')
export class ChallengeController {
  constructor(
    private readonly challengeService: ChallengeService,
    private readonly challengsLogsService: ChallengeLogsService, // Assuming this service is imported correctly
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createChallengeDto: CreateChallengeDto) {
    return this.challengeService.create(createChallengeDto);
  }

  @Get()
  async findAll() {
    return await this.challengeService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return await this.challengeService.findOne(+id);
  }

  @Patch(':id')
  async update(@Param('id', ParseIntPipe) id: number, @Body() updateChallengeDto: UpdateChallengeDto) {
    return this.challengeService.update(+id, updateChallengeDto);
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.challengeService.remove(+id);
  }

  @Get('logs/:userId')
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
