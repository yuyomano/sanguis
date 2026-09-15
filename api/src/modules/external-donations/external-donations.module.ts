import { Module } from '@nestjs/common';
import { ExternalDonationsController } from './external-donations.controller';
import { ExternalDonationsService } from './external-donations.service';
import { DonorsModule } from '../donors/donors.module';
import { RewardsModule } from '../rewards/rewards.module';

@Module({
  imports: [DonorsModule, RewardsModule],
  controllers: [ExternalDonationsController],
  providers: [ExternalDonationsService],
})
export class ExternalDonationsModule {}
