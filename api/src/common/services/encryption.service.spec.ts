// ponytail: @nestjs/common (v12, ESM) rompe bajo el runtime CJS de Jest sin un
// pipeline de transformación completo para node_modules — se mockean los dos
// decoradores usados por EncryptionService en vez de arreglar esa infraestructura
// no relacionada con esta prueba.
jest.mock('@nestjs/common', () => ({ Injectable: () => () => {}, Logger: class { warn() {} } }));
jest.mock('@nestjs/config', () => ({ ConfigService: class {} }));

import { EncryptionService } from './encryption.service';

// ponytail: shim minimal en vez de armar un TestingModule de Nest completo —
// EncryptionService solo llama a config.get(key).
function makeService(key?: string) {
  return new EncryptionService({ get: () => key } as any);
}

const KEY = 'a'.repeat(64); // 32 bytes hex

describe('EncryptionService', () => {
  it('encrypt/decrypt es reversible y no determinístico', () => {
    const svc = makeService(KEY);
    const a = svc.encrypt('001-1234567-1');
    const b = svc.encrypt('001-1234567-1');
    expect(a).not.toBe(b); // IV aleatorio → ciphertext distinto cada vez
    expect(svc.decrypt(a)).toBe('001-1234567-1');
    expect(svc.decrypt(b)).toBe('001-1234567-1');
  });

  it('hash es determinístico (requisito del índice ciego)', () => {
    const svc = makeService(KEY);
    expect(svc.hash('maria@email.com')).toBe(svc.hash('maria@email.com'));
    expect(svc.hash('maria@email.com')).not.toBe(svc.hash('otro@email.com'));
  });

  it('degrada a passthrough sin ENCRYPTION_KEY (no rompe si falta la env var)', () => {
    const svc = makeService(undefined);
    expect(svc.encrypt('001-1234567-1')).toBe('001-1234567-1');
    expect(svc.hash('001-1234567-1')).toBe('001-1234567-1');
    expect(svc.decrypt('001-1234567-1')).toBe('001-1234567-1');
  });

  it('decrypt de un valor no cifrado (dato legado en texto plano) lo devuelve tal cual', () => {
    const svc = makeService(KEY);
    expect(svc.decrypt('18.4746')).toBe('18.4746');
  });
});
