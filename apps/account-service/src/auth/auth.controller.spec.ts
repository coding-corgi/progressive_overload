import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

describe('AuthController', () => {
  let controller: AuthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        AuthService,
        {
          provide: 'UserRepository',
          useValue: {}, // Mocking UserRepository
        },
        {
          provide: UsersService,
          useValue: {}, // Mocking UserService
        },
        {
          provide: JwtService,
          useValue: {}, // Mocking UserRepository
        },
        { provide: ConfigService, useValue: {} }, // Mocking ConfigService
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
