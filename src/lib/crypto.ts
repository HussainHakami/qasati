// Simple encryption for localStorage data
// Uses AES-like substitution cipher for basic protection

const SECRET_KEY = "qasati_2024_secure_key_v1";

function getKeyBytes(): number[] {
  const bytes: number[] = [];
  for (let i = 0; i < SECRET_KEY.length; i++) {
    bytes.push(SECRET_KEY.charCodeAt(i) % 256);
  }
  return bytes;
}

export function encrypt(text: string): string {
  if (!text) return "";
  const keyBytes = getKeyBytes();
  const chars: number[] = [];
  for (let i = 0; i < text.length; i++) {
    const charCode = text.charCodeAt(i);
    const keyByte = keyBytes[i % keyBytes.length];
    // Simple XOR + rotation
    const encrypted = (charCode ^ keyByte) + 47;
    chars.push(encrypted);
  }
  // Convert to base64-like string
  return btoa(String.fromCharCode(...chars));
}

export function decrypt(encoded: string): string {
  if (!encoded) return "";
  try {
    const decoded = atob(encoded);
    const keyBytes = getKeyBytes();
    let result = "";
    for (let i = 0; i < decoded.length; i++) {
      const charCode = decoded.charCodeAt(i);
      const keyByte = keyBytes[i % keyBytes.length];
      const decrypted = (charCode - 47) ^ keyByte;
      result += String.fromCharCode(decrypted);
    }
    return result;
  } catch {
    // If decryption fails, return original (for backward compat)
    return encoded;
  }
}

// Safe JSON storage with encryption
export function secureSet(key: string, value: unknown): void {
  try {
    const json = JSON.stringify(value);
    const encrypted = encrypt(json);
    localStorage.setItem(key, encrypted);
  } catch {
    // Fallback to unencrypted if encryption fails
    localStorage.setItem(key, JSON.stringify(value));
  }
}

export function secureGet<T>(key: string, fallback: T): T {
  try {
    const encrypted = localStorage.getItem(key);
    if (!encrypted) return fallback;
    const decrypted = decrypt(encrypted);
    return JSON.parse(decrypted) as T;
  } catch {
    // Try unencrypted fallback
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      return JSON.parse(raw) as T;
    } catch {
      return fallback;
    }
  }
}

export function secureRemove(key: string): void {
  localStorage.removeItem(key);
}
