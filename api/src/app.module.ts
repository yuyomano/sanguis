import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from './common/prisma/prisma.module';
import { CommonModule } from './common/common.module';
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
import { EmergencyRequestsModule } from './modules/emergency-requests/emergency-requests.module';
import { ExternalDonationsModule } from './modules/external-donations/external-donations.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([
      // General API: 100 requests per minute
      { name: 'global', ttl: 60_000, limit: 100 },
      // Auth endpoints: 10 attempts per 5 minutes (brute-force protection)
      { name: 'auth', ttl: 300_000, limit: 10 },
    ]),
    ScheduleModule.forRoot(),
    PrismaModule,
    CommonModule,
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
    EmergencyRequestsModule,
    ExternalDonationsModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
