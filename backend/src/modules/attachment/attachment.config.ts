// backend/src/modules/file/file.config.ts
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export const ALLOWED_MIME = [
  'image/png',
  'image/jpeg',
  'image/webp',
  'application/pdf',
];

export async function signFile(path: string, exp: number, secret: string) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const sig = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(`${path}:${exp}`)
  );

  return btoa(String.fromCharCode(...new Uint8Array(sig)));
}

export async function verifyFileSig(path: string, exp: number, secret: string, sig: string) {
  if (Date.now() > exp) return false;
  const expected = await signFile(path, exp, secret);
  return expected === sig;
}
