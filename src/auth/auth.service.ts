import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User, UserStatus } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto): Promise<{ message: string }> {
    await this.usersService.create(registerDto);
    
    return {
      message: '회원가입이 완료되었습니다. 관리자 승인을 기다려주세요.',
    };
  }

  async login(loginDto: LoginDto): Promise<{ success: boolean; message: string; accessToken?: string; user?: Partial<User> }> {
    const { username, password } = loginDto;
    
    try {
      // 사용자 찾기
      const user = await this.usersService.findByUsername(username);
      if (!user) {
        return {
          success: false,
          message: '사용자 이름 또는 비밀번호가 올바르지 않습니다.'
        };
      }
      
      // 승인 상태 확인
      if (user.status !== UserStatus.ACTIVE) {
        return {
          success: false,
          message: '아직 승인되지 않은 계정입니다. 관리자 승인을 기다려주세요.'
        };
      }

      // 비밀번호 확인
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return {
          success: false,
          message: '사용자 이름 또는 비밀번호가 올바르지 않습니다.'
        };
      }

      // JWT 토큰 생성
      const payload = { sub: user.id, username: user.username, role: user.role };
      const accessToken = this.jwtService.sign(payload);

      // 민감한 정보 제외하고 반환
      const { password: _, ...userWithoutPassword } = user;

      return {
        success: true,
        message: '로그인 성공',
        accessToken,
        user: userWithoutPassword,
      };
    } catch (error) {
      return {
        success: false,
        message: '로그인 처리 중 오류가 발생했습니다.'
      };
    }
  }

  async validateUser(payload: any): Promise<User> {
    return this.usersService.findById(payload.sub);
  }
}
