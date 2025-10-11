import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CodeGroup } from './entities/code-group.entity';
import { CodeDetail } from './entities/code-detail.entity';
import { CodeGroupService } from './code-group.service';
import { CodeDetailService } from './code-detail.service';
import { CodeGroupController } from './code-group.controller';
import { CodeDetailController } from './code-detail.controller';
import { LogModule } from '../log/log.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([CodeGroup, CodeDetail]),
    LogModule,
  ],
  controllers: [CodeGroupController, CodeDetailController],
  providers: [CodeGroupService, CodeDetailService],
  exports: [CodeGroupService, CodeDetailService],
})
export class CodeModule {}
