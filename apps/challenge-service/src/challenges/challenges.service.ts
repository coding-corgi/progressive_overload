import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CreateChallengeDto } from './dto/create-challenge.dto';
import { UpdateChallengeDto } from './dto/update-challenge.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Challenge } from './entities/challenge.entity';
import { Repository } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { AxiosError } from 'axios';
import { ClientProxy } from '@nestjs/microservices';
import { ChallengeLogsService } from '../redis/challenges.redis';

@Injectable()
export class ChallengeService {
  constructor(
    @InjectRepository(Challenge)
    private readonly challengeRepository: Repository<Challenge>,
    private readonly httpService: HttpService,
    @Inject('ACCOUNT_SERVICE') private readonly accountClient: ClientProxy,
    private readonly challengeLogService: ChallengeLogsService,
  ) {}

  async create(createChallengeDto: CreateChallengeDto) {
    const { userId, title } = createChallengeDto;
    try {
      this.accountClient.emit('validate_user', { userId });
      console.log('[📤] validate_user emitted:', userId);
    } catch (err) {
      const axiosErr = err as AxiosError;
      if (axiosErr?.response?.status === 404) {
        throw new NotFoundException(`userId가 ${userId}인 사용자가 없습니다`);
      }
    }

    const challenge = await this.challengeRepository.findOneBy({ title });
    if (challenge) {
      throw new ConflictException('이미 존재하는 챌린지입니다');
    }

    try {
      const newChallenge = this.challengeRepository.create(createChallengeDto);
      const save = await this.challengeRepository.save(newChallenge);
      await this.challengeLogService.logChallengecreation(save.id, userId);
      return save;
    } catch {
      throw new ConflictException('챌린지 생성에 실패했습니다. 다시 시도해주세요.');
    }
  }

  async findAll() {
    console.log('[📥] findAll called');
    return await this.challengeRepository.find();
  }

  async findOne(id: number) {
    const challenge = await this.challengeRepository.findOneBy({ id });
    if (!challenge) {
      throw new NotFoundException(`id가 ${id}인 챌린지가 없습니다`);
    }
    return challenge;
  }

  async update(id: number, updateChallengeDto: UpdateChallengeDto) {
    const challenge = await this.challengeRepository.findOneBy({ id });
    if (!challenge) {
      throw new NotFoundException(`id가 ${id}인 챌린지가 없습니다`);
    }
    const updatedChallenge = { ...challenge, ...updateChallengeDto };
    return await this.challengeRepository.save(updatedChallenge);
  }

  async remove(id: number) {
    const result = await this.challengeRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`id가 ${id}인 챌린지가 없습니다`);
    }
    return {
      message: `id가 ${id}인 챌린지가 삭제되었습니다`,
    };
  }
}
