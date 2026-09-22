const SALT_BYTES = 16;
const IV_BYTES = 12;
const PBKDF2_ITERATIONS = 150_000;

export interface EncryptedPayload {
  iv: string;
  data: string;
}

function toBase64(bytes: Uint8Array): string {
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}

function fromBase64(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export function randomSalt(): string {
  return toBase64(crypto.getRandomValues(new Uint8Array(SALT_BYTES)));
}

export async function deriveVaultKey(pin: string, saltB64: string): Promise<CryptoKey> {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(pin),
    'PBKDF2',
    false,
    ['deriveKey'],
  );
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: fromBase64(saltB64) as BufferSource, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

export async function encryptText(key: CryptoKey, text: string): Promise<EncryptedPayload> {
  const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));
  const cipher = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(text));
  return { iv: toBase64(iv), data: toBase64(new Uint8Array(cipher)) };
}

export async function decryptText(key: CryptoKey, payload: EncryptedPayload): Promise<string> {
  const plain = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: fromBase64(payload.iv) as BufferSource },
    key,
    fromBase64(payload.data) as BufferSource,
  );
  return new TextDecoder().decode(plain);
}
