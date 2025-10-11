import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { StockService } from './stock.service';
import { UserRole } from '../auth/enums/role.enum';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CreateStockDto } from './dto/create-stock.dto';
// import { UpdateStockDto } from './dto/update-stock.dto';

@Controller('stocks')
export class StockController {
  constructor(private readonly stockService: StockService) {}

  // 모든 재고 조회
  @Get()
  async findAll() {
    return this.stockService.findAll();
  }

  // 재고 추가, 수정, 삭제
  @Post()
  @UseGuards(AuthGuard('jwt'))
  async saveStock(@Body() stockDtos: CreateStockDto[]) {
    return this.stockService.saveStock(stockDtos);
  }

  // // 재고 수정
  // @Put(':id')
  // @UseGuards(AuthGuard('jwt'), RolesGuard)
  // @Roles(UserRole.ADMIN)
  // async update(
  //   @Param('id') id: number,
  //   @Body() updateStockDto: UpdateStockDto,
  // ) {
  //   return this.stockService.update(id, updateStockDto);
  // }

  // // 재고 삭제
  // @Delete(':id')
  // @UseGuards(AuthGuard('jwt'), RolesGuard)
  // @Roles(UserRole.ADMIN)
  // async delete(@Param('id') id: number) {
  //   return this.stockService.delete(id);
  // }
  // }

  // // 사용자 승인 처리 (관리자만)
  // @UseGuards(AuthGuard('jwt'), RolesGuard)
  // @Roles(UserRole.ADMIN)
  // @Post('approve')
  // async approveUser(@Body() approveUserDto: ApproveUserDto) {
  //   return this.usersService.approveUser(approveUserDto);
  // }

  // // 특정 사용자 조회
  // @UseGuards(AuthGuard('jwt'))
  // @Get(':id')
  // async getUserById(@Param('id') id: string) {
  //   return this.usersService.findById(id);
  // }
}
