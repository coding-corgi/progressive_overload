import { Test, TestingModule } from '@nestjs/testing';
import { ChallengeServiceController } from './challenge-service.controller';
import { ChallengeServiceService } from './challenge-service.service';

describe('ChallengeServiceController', () => {
  let challengeServiceController: ChallengeServiceController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [ChallengeServiceController],
      providers: [ChallengeServiceService],
    }).compile();

    challengeServiceController = app.get<ChallengeServiceController>(ChallengeServiceController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(challengeServiceController.getHello()).toBe('Hello World!');
    });
  });
});
