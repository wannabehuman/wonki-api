import { Controller, Post, Body } from '@nestjs/common';
import { StockBaseService } from '../basecode/stock-base.service';

@Controller('master/items')
export class ItemsController {
  constructor(private readonly stockBaseService: StockBaseService) {}

  @Post()
  async handleRequest(@Body() body: any) {
    const { mode, ...filterData } = body;

    switch (mode) {
      case 'SELECT':
      case 'select':
        // 조회 로직
        if (filterData.code) {
          return { data: [await this.stockBaseService.findOne(filterData.code)] };
        }
        if (filterData.category) {
          return { data: await this.stockBaseService.findByCategory(filterData.category) };
        }
        return { data: await this.stockBaseService.findAll() };

      case 'INSERT':
      case 'insert':
        // 등록 로직
        const created = await this.stockBaseService.create(filterData);
        return { success: true, data: created };

      case 'UPDATE':
      case 'update':
        // 수정 로직
        const { code, ...updateData } = filterData;
        const updated = await this.stockBaseService.update(code, updateData);
        return { success: true, data: updated };

      case 'DELETE':
      case 'delete':
        // 삭제 로직
        await this.stockBaseService.remove(filterData.code);
        return { success: true, message: 'Deleted successfully' };

      default:
        throw new Error(`Unsupported mode: ${mode}`);
    }
  }
}
