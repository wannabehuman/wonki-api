import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserStatus } from './entities/user.entity';
import { ApproveUserDto } from './dto/approve-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async findByUsername(username: string): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { username } });
    return user;
  }

  async findById(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }
    return user;
  }

  async create(userData: Partial<User>): Promise<User> {
    // 사용자 이름 중복 체크
    const existingUser = await this.findByUsername(userData.username);
    if (existingUser) {
      throw new ConflictException('이미 존재하는 사용자 이름입니다.');
    }

    // 비밀번호 암호화
    const hashedPassword = await bcrypt.hash(userData.password, 10);

    const newUser = this.usersRepository.create({
      ...userData,
      password: hashedPassword,
      status: UserStatus.PENDING, // 기본적으로 승인 대기 상태로 설정
    });

    return this.usersRepository.save(newUser);
  }

  async getAll(): Promise<User[]> {
    return this.usersRepository.find();
  }

  async getPendingUsers(): Promise<User[]> {
    return this.usersRepository.find({ where: { status: UserStatus.PENDING } });
  }

  async approveUser(approveUserDto: ApproveUserDto): Promise<User> {
    const { userId, status, approvedBy } = approveUserDto;
    const user = await this.findById(userId);

    user.status = status;
    user.approvedBy = approvedBy;
    user.approvedAt = new Date();

    return this.usersRepository.save(user);
  }
}
