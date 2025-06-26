import { Injectable } from '@nestjs/common';

@Injectable()
export class ChallengeServiceService {
  getHello(): string {
    return 'Hello World!';
  }
}
