import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';

@Controller()
export class ChallengeEventsController {
  @EventPattern('user_validated')
  handleValidateUser(@Payload() Payload: { userId: string }) {
    console.log(`user validated: ${Payload.userId}`);
    //Todo 챌린지 생성 처리 로그저장
  }

  @EventPattern('user_not_found')
  handleUserNotFound(@Payload() payload: { userId: string; reason?: string }) {
    console.log(`user not found: ${payload.userId}, reason: ${payload.reason}`);
    //Todo 챌린지 생성 처리 로그저장
  }
}
