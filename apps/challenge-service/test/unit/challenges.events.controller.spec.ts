import { Test, TestingModule } from '@nestjs/testing';
import { ChallengeEventsController } from '../../src/events/challenges.events.controller';
import { ChallengeService } from '../../src/challenges/challenges.service';
import { ChallengeLogsService } from '../../src/redis/challenges.redis';

describe('ChallengeEventsController', () => {
  let controller: ChallengeEventsController;
  let challengeService: ChallengeService;
  let challengeLogsService: ChallengeLogsService;

  beforeEach(async () => {
    const challengeServiceMock = {
      findByTitle: jest.fn(),
      createForValidatedUser: jest.fn(),
    };

    const challengeLogsServiceMock = {
      getCachedPendingChallenge: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ChallengeEventsController],
      providers: [
        {
          provide: ChallengeService,
          useValue: challengeServiceMock,
        },
        {
          provide: ChallengeLogsService,
          useValue: challengeLogsServiceMock,
        },
      ],
    }).compile();

    controller = module.get<ChallengeEventsController>(ChallengeEventsController);
    challengeService = module.get<ChallengeService>(ChallengeService);
    challengeLogsService = module.get<ChallengeLogsService>(ChallengeLogsService);
  });

  it('handleUserValidated - 유저 검증 성공 시 챌린지 생성', async () => {
    const payload = { userId: '1' };

    const logSpy = jest.spyOn(challengeLogsService, 'getCachedPendingChallenge').mockResolvedValue({
      title: 'Test Challenge',
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 86400000).toISOString(),
      userId: 1,
      description: 'Test Description',
    });

    const findTitleSpy = jest.spyOn(challengeService, 'findByTitle').mockResolvedValue(null);
    const createSpy = jest.spyOn(challengeService, 'createForValidatedUser').mockResolvedValue({
      id: 1,
      title: 'Test Challenge',
      startDate: new Date(),
      endDate: new Date(Date.now() + 86400000),
      userId: 1,
      description: 'Test Description',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await controller.handleUserValidated(payload);

    expect(logSpy).toHaveBeenCalledWith(payload.userId);
    expect(findTitleSpy).toHaveBeenCalledWith('Test Challenge');
    expect(createSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Test Challenge',
        userId: 1,
        description: 'Test Description',
      }),
    );
  });

  it('handleUserValidated - 유저 검증 실패 시 처리', async () => {
    const payload = { userId: '999' };
    const logSpy = jest.spyOn(console, 'warn').mockImplementation();

    await controller.handleUserValidated(payload);
    expect(logSpy).toHaveBeenCalledWith(`[!] user_validated but no pending DTO for user ${payload.userId}`);

    logSpy.mockRestore();
  });

  it('handleUserNotFound - 유저가 없을 때 처리', () => {
    const payload = { userId: '999', reason: 'User not found' };
    const logSpy = jest.spyOn(console, 'log').mockImplementation();

    controller.handleUserNotFound(payload);
    expect(logSpy).toHaveBeenCalledWith(`user not found: ${payload.userId}, reason: ${payload.reason}`);

    logSpy.mockRestore();
  });
});
