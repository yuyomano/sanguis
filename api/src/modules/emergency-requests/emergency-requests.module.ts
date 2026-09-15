import { Module } from '@nestjs/common';
import { EmergencyRequestsController } from './emergency-requests.controller';
import { EmergencyRequestsService } from './emergency-requests.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [EmergencyRequestsController],
  providers: [EmergencyRequestsService],
})
export class EmergencyRequestsModule {}
