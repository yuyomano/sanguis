import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as admin from 'firebase-admin';

export interface FcmPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
}

@Injectable()
export class FcmService implements OnModuleInit {
  private readonly logger = new Logger(FcmService.name);
  private initialized = false;

  onModuleInit() {
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    if (!raw) {
      this.logger.warn('FIREBASE_SERVICE_ACCOUNT_JSON no configurado — push FCM deshabilitado');
      return;
    }
    try {
      const serviceAccount = JSON.parse(raw);
      if (!admin.apps.length) {
        admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
      }
      this.initialized = true;
      this.logger.log('Firebase Admin SDK inicializado');
    } catch (e) {
      this.logger.error('Error inicializando Firebase Admin — push FCM deshabilitado', e);
    }
  }

  async sendToToken(token: string, payload: FcmPayload): Promise<void> {
    if (!this.initialized) return;
    try {
      await admin.messaging().send({
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
    if (!this.initialized || tokens.length === 0) return;
    const chunks = this.chunk(tokens, 500); // FCM multicast limit
    for (const chunk of chunks) {
      try {
        const res = await admin.messaging().sendEachForMulticast({
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
