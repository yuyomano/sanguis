import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class WhatsappService {
  private readonly logger = new Logger(WhatsappService.name);

  constructor(private config: ConfigService) {}

  async sendTemplateMessage(phone: string, templateName: string, variables: string[]) {
    const phoneNumberId = this.config.get('WHATSAPP_PHONE_NUMBER_ID');
    const token = this.config.get('WHATSAPP_ACCESS_TOKEN');

    if (!phoneNumberId || !token) {
      this.logger.warn('WhatsApp API not configured');
      return null;
    }

    const normalizedPhone = phone.replace(/[^0-9]/g, '');

    try {
      const response = await axios.post(
        `${this.config.get('WHATSAPP_API_URL')}/${phoneNumberId}/messages`,
        {
          messaging_product: 'whatsapp',
          to: normalizedPhone,
          type: 'template',
          template: {
            name: templateName,
            language: { code: 'es' },
            components: variables.length
              ? [
                  {
                    type: 'body',
                    parameters: variables.map((v) => ({ type: 'text', text: v })),
                  },
                ]
              : undefined,
          },
        },
        { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } },
      );
      return response.data;
    } catch (error) {
      this.logger.error(`WhatsApp send failed to ${normalizedPhone}: ${error.message}`);
      throw error;
    }
  }

  async sendTextMessage(phone: string, message: string) {
    const phoneNumberId = this.config.get('WHATSAPP_PHONE_NUMBER_ID');
    const token = this.config.get('WHATSAPP_ACCESS_TOKEN');

    if (!phoneNumberId || !token) return null;

    const normalizedPhone = phone.replace(/[^0-9]/g, '');

    try {
      const response = await axios.post(
        `${this.config.get('WHATSAPP_API_URL')}/${phoneNumberId}/messages`,
        {
          messaging_product: 'whatsapp',
          to: normalizedPhone,
          type: 'text',
          text: { body: message },
        },
        { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } },
      );
      return response.data;
    } catch (error) {
      this.logger.error(`WhatsApp text failed: ${error.message}`);
      throw error;
    }
  }
}
