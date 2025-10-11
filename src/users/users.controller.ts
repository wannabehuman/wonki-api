import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApproveUserDto } from './dto/approve-user.dto';
import { UsersService } from './users.service';
import { UserRole } from '../auth/enums/role.enum';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  // 승인 대기중인 사용자 목록 조회 (관리자만)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get('pending')
  async getPendingUsers() {
    return this.usersService.getPendingUsers();
  }

  // 모든 사용자 목록 조회 (관리자만)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get()
  async getAllUsers() {
    return this.usersService.getAll();
  }

  // 사용자 승인 처리 (관리자만)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post('approve')
  async approveUser(@Body() approveUserDto: ApproveUserDto) {
    return this.usersService.approveUser(approveUserDto);
  }

  // 특정 사용자 조회
  @UseGuards(AuthGuard('jwt'))
  @Get(':id')
  async getUserById(@Param('id') id: string) {
    return this.usersService.findById(id);
  }
}
