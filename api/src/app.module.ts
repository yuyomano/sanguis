import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from './common/prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { DonorsModule } from './modules/donors/donors.module';
import { BloodUnitsModule } from './modules/blood-units/blood-units.module';
import { TestingModule } from './modules/testing/testing.module';
import { EventsModule } from './modules/events/events.module';
import { LogisticsModule } from './modules/logistics/logistics.module';
import { RewardsModule } from './modules/rewards/rewards.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { FinanceModule } from './modules/finance/finance.module';
import { ReportsModule } from './modules/reports/reports.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    ScheduleModule.forRoot(),
    PrismaModule,
    AuthModule,
    DonorsModule,
    BloodUnitsModule,
    TestingModule,
    EventsModule,
    LogisticsModule,
    RewardsModule,
    NotificationsModule,
    FinanceModule,
    ReportsModule,
  ],
})
export class AppModule {}
