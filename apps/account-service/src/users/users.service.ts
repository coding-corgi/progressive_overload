import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const { email } = createUserDto;
    const existedUser = await this.userRepository.findOneBy({ email });

    if (existedUser) {
      throw new ConflictException('이미 존재하는 이메일입니다');
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    const createUser = this.userRepository.create({
      ...createUserDto,
      password: hashedPassword,
      email: email.toLowerCase(),
    });

    return await this.userRepository.save(createUser);
  }

  async findOneByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOneBy({ email: email.toLowerCase() });
  }

  async findAll(): Promise<User[]> {
    return await this.userRepository.find();
  }

  async findOne(id: number): Promise<User> {
    const user = await this.userRepository.findOneBy({ id });

    if (!user) {
      throw new NotFoundException(`id가 ${id}인 유저가 없습니다`);
    } else {
      return user;
    }
  }

  async update(id: number, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.userRepository.findOneBy({ id });

    if (!user) {
      throw new NotFoundException(`id가 ${id}인 유저가 없습니다`);
    }

    const updateInfo = Object.assign(user, updateUserDto);
    return await this.userRepository.save(updateInfo);
  }

  async remove(id: number): Promise<void> {
    const result = await this.userRepository.delete(id);

    if (result.affected === 0) {
      throw new NotFoundException(`id가 ${id}인 유저가 없습니다`);
    }
  }

  async findOneById(id: number): Promise<User | null> {
    return this.userRepository.findOneBy({ id });
  }
}
