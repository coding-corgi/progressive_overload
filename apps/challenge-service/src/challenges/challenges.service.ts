import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CreateChallengeDto } from './dto/create-challenge.dto';
import { UpdateChallengeDto } from './dto/update-challenge.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Challenge } from './entities/challenge.entity';
import { Repository } from 'typeorm';
import { HttpService } from '@nestjs/axios';
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
    const { userId } = createChallengeDto;

    // 1️⃣ Redis 등에 DTO 캐시 저장 (TTL 설정, 임시 저장)
    await this.challengeLogService.cachePendingChallenge(userId, createChallengeDto);

    // 2️⃣ 유저 검증 이벤트 emit
    this.accountClient.emit('validate_user', { userId });
    console.log('[📤] validate_user emitted:', userId);

    return {
      message: '유저 검증 요청이 전송되었습니다. 유효 시 챌린지 생성이 진행됩니다.',
    };
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

  async createForValidatedUser(createChallengeDto: CreateChallengeDto) {
    const newChallenge = this.challengeRepository.create(createChallengeDto);
    const savedChallenge = await this.challengeRepository.save(newChallenge);
    console.log('[✅] 챌린지 생성 완료:', savedChallenge);

    await this.challengeLogService.logChallengecreation(savedChallenge.id, createChallengeDto.userId);
    return savedChallenge;
  }

  async findByTitle(title: string) {
    return await this.challengeRepository.findOneBy({ title });
  }
}
