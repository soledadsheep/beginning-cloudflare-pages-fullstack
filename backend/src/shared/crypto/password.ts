// backend/src/shared/crypto/password.ts
const encoder = new TextEncoder();
const ITERATIONS = 100_000;
const HASH_ALGO = 'sha-256';
const KEY_LENGTH = 256; // bits

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));

  const _keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );

  const bits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt,
      iterations: ITERATIONS,
      hash: HASH_ALGO,
    },
    _keyMaterial,
    KEY_LENGTH
  );

  return [
    'pbkdf2',
    HASH_ALGO,
    ITERATIONS,
    bufferToHex(salt),
    bufferToHex(bits),
  ].join('$');
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  	const parts = stored.split('$');
  	if (parts.length !== 5) return false;

	const [algo, hashName, iterationsStr, saltHex, hashHex] = parts as [string, string, string, string, string];
  	if (algo !== 'pbkdf2' || hashName !== HASH_ALGO) return false;

  	const iterations = Number(iterationsStr);
  	if (!Number.isFinite(iterations)) return false;

	const salt = hexToBuffer(saltHex);
	const expected = hexToBuffer(hashHex);

	const _keyMaterial = await crypto.subtle.importKey(
		'raw',
		encoder.encode(password),
		{ name: 'PBKDF2' },
		false,
		['deriveBits']
	);

	const bits = await crypto.subtle.deriveBits(
		{
			name: 'PBKDF2',
			salt,
			iterations,
			hash: HASH_ALGO,
		},
		_keyMaterial,
		256
	);

	return timingSafeEqual(
		new Uint8Array(bits),
		expected
	);
}

function bufferToHex(buffer: ArrayBuffer | Uint8Array): string {
	const bytes =
		buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
	return [...bytes]
		.map(b => b.toString(16).padStart(2, '0'))
		.join('');
}

function hexToBuffer(hex: string): Uint8Array {
	return new Uint8Array(
		hex.match(/.{2}/g)!.map(b => parseInt(b, 16))
	);
}

function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
	if (a.byteLength !== b.byteLength) return false;

	const av = new DataView(a.buffer, a.byteOffset, a.byteLength);
	const bv = new DataView(b.buffer, b.byteOffset, b.byteLength);

	let diff = 0;
	for (let i = 0; i < av.byteLength; i++) {
		diff |= av.getUint8(i) ^ bv.getUint8(i);
	}

	return diff === 0;
}
