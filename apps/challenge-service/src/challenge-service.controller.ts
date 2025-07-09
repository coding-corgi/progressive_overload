import { Controller, Get } from '@nestjs/common';
import { ChallengeServiceService } from './challenge-service.service';
import { ApiExcludeController } from '@nestjs/swagger';

@ApiExcludeController()
@Controller()
export class ChallengeServiceController {
  constructor(private readonly challengeServiceService: ChallengeServiceService) {}

  @Get()
  getHello(): string {
    return this.challengeServiceService.getHello();
  }
}
