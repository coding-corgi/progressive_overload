import { Controller, Get } from '@nestjs/common';
import { AppService } from './account-service.service';

@Controller()
export class AccountServiceController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}
