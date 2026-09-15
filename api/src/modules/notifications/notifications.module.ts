import { Module } from '@nestjs/common';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { WhatsappService } from './whatsapp.service';
import { EmailService } from './email.service';
import { FcmService } from './fcm.service';

@Module({
  controllers: [NotificationsController],
  providers: [NotificationsService, WhatsappService, EmailService, FcmService],
  exports: [NotificationsService, FcmService, WhatsappService, EmailService],
})
export class NotificationsModule {}
