import { Module } from '@nestjs/common';
import { MasterPlanService } from './master-plan.service';
import { MasterPlanController } from './master-plan.controller';

@Module({
  controllers: [MasterPlanController],
  providers: [MasterPlanService],
  exports: [MasterPlanService],
})
export class MasterPlanModule {}
