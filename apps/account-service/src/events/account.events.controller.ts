import { Controller, Inject } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { ClientProxy, EventPattern, Payload } from '@nestjs/microservices';

@Controller()
export class AccountEventsController {
  constructor(
    private readonly usersService: UsersService,
    @Inject('CHALLENGE_SERVICE') private readonly challengeClient: ClientProxy,
  ) {}

  @EventPattern('validate_user')
  async handleValidateUser(@Payload() payload: { userId: string }) {
    const userId = payload.userId;
    const user = await this.usersService.findOne(+userId);

    if (user) {
      this.challengeClient.emit('user_validated', { userId });
    } else {
      this.challengeClient.emit('user_not_found', { userId, reason: 'User not found' });
    }
  }
}
