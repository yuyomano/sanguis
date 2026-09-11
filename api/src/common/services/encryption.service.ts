import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

const ALGO = 'aes-256-gcm';
const IV_BYTES = 12;
const TAG_BYTES = 16;

@Injectable()
export class EncryptionService {
  private readonly logger = new Logger(EncryptionService.name);
  private readonly key: Buffer | null = null;
  private readonly enabled: boolean;

  constructor(config: ConfigService) {
    const keyHex = config.get<string>('ENCRYPTION_KEY');
    if (!keyHex || keyHex.length < 64) {
      this.logger.warn(
        'ENCRYPTION_KEY no configurada o muy corta — cifrado de campos deshabilitado. ' +
        'Genera una con: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"',
      );
      this.enabled = false;
    } else {
      this.key = Buffer.from(keyHex.slice(0, 64), 'hex');
      this.enabled = true;
    }
  }

  encrypt(plaintext: string): string {
    if (!this.enabled || !this.key) return plaintext;
    const iv = crypto.randomBytes(IV_BYTES);
    const cipher = crypto.createCipheriv(ALGO, this.key, iv);
    const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    // Format: "enc:<iv_hex>:<tag_hex>:<data_hex>"
    return `enc:${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`;
  }

  decrypt(value: string): string {
    if (!this.enabled || !this.key || !value.startsWith('enc:')) return value;
    const parts = value.split(':');
    if (parts.length !== 4) return value;
    const [, ivHex, tagHex, dataHex] = parts;
    try {
      const iv = Buffer.from(ivHex, 'hex');
      const tag = Buffer.from(tagHex, 'hex');
      const data = Buffer.from(dataHex, 'hex');
      const decipher = crypto.createDecipheriv(ALGO, this.key, iv);
      decipher.setAuthTag(tag);
      return decipher.update(data).toString('utf8') + decipher.final('utf8');
    } catch {
      this.logger.warn('Fallo al descifrar campo — devolviendo valor original');
      return value;
    }
  }

  // Índice ciego: HMAC-SHA256 determinístico para permitir búsquedas exactas
  // (findUnique, chequeo de duplicados) sobre columnas cifradas en reposo.
  // ponytail: determinístico == vulnerable a diccionario/enumeración en valores
  // de baja entropía (teléfono, cédula). Suficiente para bloquear lectura directa
  // de un dump de BD; si hace falta resistir fuerza bruta dirigida, pasar a un
  // esquema con pepper por-registro o a búsqueda ciega con OPRF.
  hash(value: string): string {
    if (!this.enabled || !this.key) return value;
    return crypto.createHmac('sha256', this.key).update(value).digest('hex');
  }

  encryptJson(obj: unknown): string {
    return this.encrypt(JSON.stringify(obj));
  }

  decryptJson<T>(value: string): T | null {
    if (!value) return null;
    try {
      return JSON.parse(this.decrypt(value)) as T;
    } catch {
      return null;
    }
  }

  isEnabled(): boolean {
    return this.enabled;
  }
}
