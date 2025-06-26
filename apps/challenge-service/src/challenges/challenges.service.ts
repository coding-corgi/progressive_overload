import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateChallengeDto } from './dto/create-challenge.dto';
import { UpdateChallengeDto } from './dto/update-challenge.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Challenge } from './entities/challenge.entity';
import { Repository } from 'typeorm';
import { firstValueFrom } from 'rxjs';
import { HttpService } from '@nestjs/axios';
import { AxiosError } from 'axios';

@Injectable()
export class ChallengeService {
  constructor(
    @InjectRepository(Challenge)
    private readonly challengeService: Repository<Challenge>,
    private readonly httpService: HttpService,
  ) {}

  async create(createChallengeDto: CreateChallengeDto) {
    const { userId, title } = createChallengeDto;
    try {
      await firstValueFrom(this.httpService.get(`/users/${userId}`));
    } catch (err) {
      const axiosErr = err as AxiosError;
      if (axiosErr?.response?.status === 404) {
        throw new NotFoundException(`userId가 ${userId}인 사용자가 없습니다`);
      }
    }

    const challenge = await this.challengeService.findOneBy({ title });
    if (challenge) {
      throw new ConflictException('이미 존재하는 챌린지입니다');
    }
    const newChallenge = this.challengeService.create(createChallengeDto);
    return await this.challengeService.save(newChallenge);
  }

  async findAll() {
    return await this.challengeService.find();
  }

  async findOne(id: number) {
    const challenge = await this.challengeService.findOneBy({ id });
    if (!challenge) {
      throw new NotFoundException(`id가 ${id}인 챌린지가 없습니다`);
    }
    return challenge;
  }

  async update(id: number, updateChallengeDto: UpdateChallengeDto) {
    const challenge = await this.challengeService.findOneBy({ id });
    if (!challenge) {
      throw new NotFoundException(`id가 ${id}인 챌린지가 없습니다`);
    }
    const updatedChallenge = { ...challenge, ...updateChallengeDto };
    return await this.challengeService.save(updatedChallenge);
  }

  async remove(id: number) {
    const result = await this.challengeService.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`id가 ${id}인 챌린지가 없습니다`);
    }
    return {
      message: `id가 ${id}인 챌린지가 삭제되었습니다`,
    };
  }
}
