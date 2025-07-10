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
    const userId = Number(payload.userId);
    const user = await this.usersService.findOne(userId);

    const event = user ? 'user_validated' : 'user_not_found';
    const message = user ? { userId } : { userId, reason: 'User not found' };

    this.challengeClient.emit(event, message);
  }
}
