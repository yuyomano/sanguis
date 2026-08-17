import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(private config: ConfigService) {}

  async sendEmail(to: string, subject: string, htmlContent: string) {
    const apiKey = this.config.get('SENDGRID_API_KEY');
    if (!apiKey) {
      this.logger.warn('SendGrid not configured');
      return null;
    }

    try {
      await axios.post(
        'https://api.sendgrid.com/v3/mail/send',
        {
          personalizations: [{ to: [{ email: to }] }],
          from: {
            email: this.config.get('SENDGRID_FROM_EMAIL', 'noreply@sanguis.do'),
            name: this.config.get('SENDGRID_FROM_NAME', 'Sanguis'),
          },
          subject,
          content: [{ type: 'text/html', value: htmlContent }],
        },
        { headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' } },
      );
      return true;
    } catch (error) {
      this.logger.error(`Email send failed to ${to}: ${error.message}`);
      throw error;
    }
  }

  buildEventNotificationHtml(eventName: string, date: string, location: string, referralCode: string) {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #C0392B; padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">🩸 Sanguis</h1>
        </div>
        <div style="padding: 30px; background: #f9f9f9;">
          <h2>Evento de Donación: ${eventName}</h2>
          <p><strong>Fecha:</strong> ${date}</p>
          <p><strong>Lugar:</strong> ${location}</p>
          <p>Tu donación puede salvar hasta 3 vidas. ¿Puedes asistir?</p>
          <a href="https://app.sanguis.do/events" style="background: #C0392B; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 10px 0;">
            Reservar mi cita
          </a>
          <p style="margin-top: 20px; font-size: 14px; color: #666;">
            ¿Conoces a alguien que pueda donar? Comparte tu código de referido: <strong>${referralCode}</strong>
          </p>
        </div>
      </div>
    `;
  }
}
