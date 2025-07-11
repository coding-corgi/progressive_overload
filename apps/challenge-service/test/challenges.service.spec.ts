import { Repository } from 'typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ChallengeService } from '../src/challenges/challenges.service';
import { Challenge } from '../src/challenges/entities/challenge.entity';
import { ChallengeLogsService } from '../src/redis/challenges.redis';

describe('ChallengesService', () => {
  let service: ChallengeService;
  let repo: Repository<Challenge>;
  let logsService: ChallengeLogsService;

  const mockRepo = {
    create: jest.fn(),
    find: jest.fn(),
    delete: jest.fn(),
    findOneBy: jest.fn(),
    save: jest.fn(),
  };

  const mockLogsService = {
    logChallengecreation: jest.fn(),
  };

  const mockChallenge = {
    id: 1,
    title: 'Updated Challenge',
    description: 'Updated description',
    startDate: new Date(),
    endDate: new Date(Date.now() + 86400000),
    userId: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as Challenge;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChallengeService,
        {
          provide: getRepositoryToken(Challenge),
          useValue: mockRepo,
        },
        {
          provide: ChallengeLogsService,
          useValue: mockLogsService,
        },
        {
          provide: 'ACCOUNT_SERVICE',
          useValue: {
            emit: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(ChallengeService);
    repo = module.get(getRepositoryToken(Challenge));
    logsService = module.get(ChallengeLogsService);
  });

  it(' SERVICE createForValidatedUser() - 챌린지 생성', async () => {
    const dto = {
      title: 'Updated Challenge',
      description: 'Updated description',
      startDate: mockChallenge.startDate.toISOString(),
      endDate: mockChallenge.endDate.toISOString(),
      userId: mockChallenge.userId,
    };

    const mockCreate = jest.spyOn(repo, 'create').mockReturnValue(mockChallenge);
    const mockSave = jest.spyOn(repo, 'save').mockResolvedValue(mockChallenge);
    const mockLog = jest.spyOn(logsService, 'logChallengecreation').mockResolvedValue();

    const result = await service.createForValidatedUser(dto);

    expect(mockCreate).toHaveBeenCalledWith(dto);
    expect(mockSave).toHaveBeenCalledWith(mockChallenge);
    expect(mockLog).toHaveBeenCalledWith(mockChallenge.id, dto.userId);
    expect(result).toEqual(mockChallenge);
  });

  it('SERVICE findOne() - 챌린지 조회 실패 시 예외 처리', async () => {
    jest.spyOn(repo, 'findOneBy').mockResolvedValue(null);
    await expect(service.findOne(999)).rejects.toThrow('id가 999인 챌린지가 없습니다');
  });

  it('SERVICE update() - 챌린지 수정 성공', async () => {
    jest.spyOn(repo, 'findOneBy').mockResolvedValue(mockChallenge);
    jest.spyOn(repo, 'save').mockResolvedValue(mockChallenge);

    const result = await service.update(1, { title: 'Updated Challenge' });

    expect(result).toEqual(mockChallenge);
  });

  it('SERVICE update() - 챌린지 조회 실패 시 예외 처리', async () => {
    jest.spyOn(repo, 'findOneBy').mockResolvedValue(null);
    await expect(service.update(999, { title: 'Nonexistent Challenge' })).rejects.toThrow(
      'id가 999인 챌린지가 없습니다',
    );
  });

  it('SERVICE remove() - 챌린지 삭제 성공', async () => {
    jest.spyOn(repo, 'delete').mockResolvedValue({ affected: 1, raw: {} });
    const result = await service.remove(1);
    expect(result).toEqual({ message: 'id가 1인 챌린지가 삭제되었습니다' });
  });

  it('SERVICE remove() - 챌린지 조회 실패 시 예외 처리', async () => {
    jest.spyOn(repo, 'delete').mockResolvedValue({ affected: 0, raw: {} });
    await expect(service.remove(999)).rejects.toThrow('id가 999인 챌린지가 없습니다');
  });

  it('SERVICE findByTitle() - 챌린지 제목으로 조회', async () => {
    jest.spyOn(repo, 'findOneBy').mockResolvedValue(mockChallenge);
    const result = await service.findByTitle('Updated Challenge');
    expect(result).toEqual(mockChallenge);
  });
});
