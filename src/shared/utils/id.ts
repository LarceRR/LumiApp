const ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyz';

/**
 * Sortable, collision-resistant local identifier. Client-generated ids are only
 * used for optimistic entities; the server id replaces them once persisted.
 */
export function createLocalId(prefix: string): string {
  const time = Date.now().toString(36).padStart(9, '0');
  let random = '';

  for (let index = 0; index < 10; index += 1) {
    random += ALPHABET[Math.floor(Math.random() * ALPHABET.length)] ?? '0';
  }

  return `${prefix}_${time}${random}`;
}

export function isLocalId(id: string): boolean {
  return id.includes('_');
}
