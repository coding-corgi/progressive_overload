import { Repository } from 'typeorm';
import { UsersService } from '../../src/users/users.service';
import { User } from '../../src/users/entities/user.entity';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

const mockUsers: User[] = [
  {
    id: 1,
    email: 'test1@test.com',
    password: 'hashed_pw1',
    name: 'Test User',
    hashedRefreshToken: 'validate token',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 2,
    email: 'test2@test.com',
    password: 'hashed_pw2',
    name: 'Another User',
    hashedRefreshToken: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

describe('UsersService', () => {
  let service: UsersService;
  let repo: Repository<User>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            find: jest.fn(),
            findOneBy: jest.fn(),
            save: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    repo = module.get<Repository<User>>(getRepositoryToken(User));
  });

  it('SERVICE findAll() - 모든 유저 조회', async () => {
    jest.spyOn(repo, 'find').mockResolvedValue(mockUsers);
    const users = await service.findAll();
    expect(users).toEqual(mockUsers);
  });

  it('SERVICE findOne() - 특정 유저 조회', async () => {
    jest.spyOn(repo, 'findOneBy').mockResolvedValue(mockUsers[0]);
    const user = await service.findOne(1);
    expect(user).toEqual(mockUsers[0]);
  });

  it('SERVCICE update() - 유저 정보 수정', async () => {
    jest.spyOn(repo, 'findOneBy').mockResolvedValue(mockUsers[0]);

    jest.spyOn(repo, 'save').mockResolvedValue({
      ...mockUsers[0],
      name: 'Updated User',
    });

    const updatedUser = await service.update(1, { name: 'Updated User' });
    expect(updatedUser).toEqual(mockUsers[0]);
  });

  it('SERVICE update() - 존재하지 않는 유저 수정 시 예외 발생', async () => {
    jest.spyOn(repo, 'findOneBy').mockResolvedValue(null);
    await expect(service.update(999, { name: 'Nonexistent User' })).rejects.toThrow('id가 999인 유저가 없습니다');
  });

  it('SERVICE remove() - 유저 삭제', async () => {
    const mockDelete = jest.spyOn(repo, 'delete').mockResolvedValue({ affected: 1, raw: {} });
    await service.remove(1);
    expect(mockDelete).toHaveBeenCalledWith(1);
  });

  it('SERVICE remove() - 존재하지 않는 유저 삭제 시 예외 발생', async () => {
    jest.spyOn(repo, 'delete').mockResolvedValue({ affected: 0, raw: {} });
    await expect(service.remove(999)).rejects.toThrow('id가 999인 유저가 없습니다');
  });

  it('SERVICE getUserByRefreshToken() - 리프래시 토큰이 있지만 매칭이 안될때 null ', async () => {
    jest.spyOn(repo, 'findOneBy').mockResolvedValue(mockUsers[0]);
    jest.spyOn(repo, 'update').mockResolvedValue({ affected: 1, raw: {}, generatedMaps: [] });

    const user = await service.getUserByRefreshToken('wrong_token', 1);
    expect(user).toBeNull();
  });
});
