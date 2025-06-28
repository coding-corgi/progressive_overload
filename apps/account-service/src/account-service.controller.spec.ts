import { Test, TestingModule } from '@nestjs/testing';
import { AccountServiceController } from './account-service.controller';
import { AppService } from './account-service.service';

describe('AppController', () => {
  let appController: AccountServiceController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AccountServiceController],
      providers: [AppService],
    }).compile();

    appController = app.get<AccountServiceController>(AccountServiceController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(appController.getHello()).toBe('Hello World!');
    });
  });
});
