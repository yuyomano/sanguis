import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';

export interface FcmPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
}

@Injectable()
export class FcmService implements OnModuleInit {
  private readonly logger = new Logger(FcmService.name);
  private app: App | null = null;

  onModuleInit() {
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    if (!raw) {
      this.logger.warn('FIREBASE_SERVICE_ACCOUNT_JSON no configurado — push FCM deshabilitado');
      return;
    }
    try {
      const serviceAccount = JSON.parse(raw);
      this.app = getApps().length
        ? getApps()[0]
        : initializeApp({ credential: cert(serviceAccount) });
      this.logger.log('Firebase Admin SDK inicializado');
    } catch (e) {
      this.logger.error('Error inicializando Firebase Admin — push FCM deshabilitado', e);
    }
  }

  async sendToToken(token: string, payload: FcmPayload): Promise<void> {
    if (!this.app) return;
    try {
      await getMessaging(this.app).send({
        token,
        notification: { title: payload.title, body: payload.body },
        data: payload.data,
        android: { priority: 'high', notification: { sound: 'default', channelId: 'sanguis_default' } },
        apns: { payload: { aps: { sound: 'default', badge: 1 } } },
      });
    } catch (e) {
      this.logger.warn(`FCM send failed for token ${token.substring(0, 10)}…: ${e}`);
    }
  }

  async sendToTokens(tokens: string[], payload: FcmPayload): Promise<void> {
    if (!this.app || tokens.length === 0) return;
    const chunks = this.chunk(tokens, 500);
    for (const chunk of chunks) {
      try {
        const res = await getMessaging(this.app).sendEachForMulticast({
          tokens: chunk,
          notification: { title: payload.title, body: payload.body },
          data: payload.data,
          android: { priority: 'high', notification: { sound: 'default', channelId: 'sanguis_default' } },
          apns: { payload: { aps: { sound: 'default', badge: 1 } } },
        });
        this.logger.log(`FCM multicast: ${res.successCount} ok, ${res.failureCount} failed`);
      } catch (e) {
        this.logger.warn(`FCM multicast failed: ${e}`);
      }
    }
  }

  private chunk<T>(arr: T[], size: number): T[][] {
    return Array.from({ length: Math.ceil(arr.length / size) }, (_, i) =>
      arr.slice(i * size, i * size + size),
    );
  }
}
