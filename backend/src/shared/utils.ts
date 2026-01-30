// backend/src/shared/utils.ts
export function randomCode(length = 6): string {
  const arr = new Uint32Array(length);
  crypto.getRandomValues(arr);

  return [...arr]
    .map(n => (n % 10).toString())
    .join('');
}

export function randomToken(bytes = 32): string {
  const arr = new Uint8Array(bytes);
  crypto.getRandomValues(arr);

  return btoa(String.fromCharCode(...arr))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}
