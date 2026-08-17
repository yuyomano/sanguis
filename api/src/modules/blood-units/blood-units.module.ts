import { Module } from '@nestjs/common';
import { BloodUnitsController } from './blood-units.controller';
import { BloodUnitsService } from './blood-units.service';

@Module({
  controllers: [BloodUnitsController],
  providers: [BloodUnitsService],
  exports: [BloodUnitsService],
})
export class BloodUnitsModule {}
