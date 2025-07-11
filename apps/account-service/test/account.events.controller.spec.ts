import { Test, TestingModule } from '@nestjs/testing';
import { AccountEventsController } from '../src/events/account.events.controller';
import { UsersService } from '../src/users/users.service';
import { ClientProxy } from '@nestjs/microservices';

describe('AccountEventsController', () => {
  let controller: AccountEventsController;
  let usersService: UsersService;
  let challengeClient: ClientProxy;

  beforeEach(async () => {
    const usersServiceMock = {
      findOne: jest.fn(),
    };

    const challengeClientMock = {
      emit: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AccountEventsController],
      providers: [
        {
          provide: UsersService,
          useValue: usersServiceMock,
        },
        {
          provide: 'CHALLENGE_SERVICE',
          useValue: challengeClientMock,
        },
      ],
    }).compile();

    controller = module.get<AccountEventsController>(AccountEventsController);
    usersService = module.get<UsersService>(UsersService);
    challengeClient = module.get<ClientProxy>('CHALLENGE_SERVICE');
  });

  it('handleValidateUser - 유저 검증 성공 시 이벤트 emit', async () => {
    const payload = { userId: '1' };
    (usersService.findOne as jest.Mock).mockResolvedValue({ id: 1 });

    await controller.handleValidateUser(payload);

    const emitSpy = jest.spyOn(challengeClient, 'emit');
    expect(emitSpy).toHaveBeenCalledWith('user_validated', { userId: 1 });
  });

  it('handleValidateUser - 유저 검증 실패 시 이벤트 emit', async () => {
    const payload = { userId: '999' };
    (usersService.findOne as jest.Mock).mockResolvedValue(null);

    await controller.handleValidateUser(payload);

    const emitSpy = jest.spyOn(challengeClient, 'emit');
    expect(emitSpy).toHaveBeenCalledWith('user_not_found', { userId: 999, reason: 'User not found' });
  });
});
