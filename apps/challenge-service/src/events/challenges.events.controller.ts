import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { ApiTags } from '@nestjs/swagger';
import { ChallengeLogsService } from '../redis/challenges.redis';
import { ChallengeService } from '../challenges/challenges.service';

@ApiTags('events')
@Controller()
export class ChallengeEventsController {
  constructor(
    private readonly challengeService: ChallengeService,
    private readonly challengeLogService: ChallengeLogsService,
  ) {}

  @EventPattern('user_validated')
  async handleValidateUser(@Payload() payload: { userId: string }) {
    console.log('[📥] user_validated 이벤트 수신:', payload.userId);

    const cached = await this.challengeLogService.getCachedPendingChallenge(payload.userId);
    if (!cached) {
      console.warn(`[!] user_validated but no pending DTO for user ${payload.userId}`);
      return;
    }

    const exists = await this.challengeService.findByTitle(cached.title);
    if (exists) {
      console.log(`[⚠] 챌린지 중복됨: ${cached.title}`);
      return;
    }

    const dto = {
      ...cached,
      startDate: new Date(cached.startDate),
      endDate: new Date(cached.endDate),
      userId: Number(payload.userId),
    };

    await this.challengeService.createForValidatedUser(dto);
  }

  @EventPattern('user_not_found')
  handleUserNotFound(@Payload() payload: { userId: string; reason?: string }) {
    console.log(`user not found: ${payload.userId}, reason: ${payload.reason}`);
    //Todo 챌린지 생성 처리 로그저장
  }
}
