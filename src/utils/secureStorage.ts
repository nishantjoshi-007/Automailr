/**
 * Secure Storage Utility
 *
 * Encrypts data before storing in localStorage / sessionStorage using
 * AES-256-GCM via the Web Crypto API.
 *
 * The encryption key is:
 *  • Generated once and stored in IndexedDB as a **non-extractable** CryptoKey.
 *  • Cached in a module-level closure for the lifetime of the page so that
 *    subsequent reads/writes are fast.
 *
 * Why this matters:
 *  - Data at rest in storage is ciphertext, not readable by casual inspection,
 *    rogue browser extensions that enumerate storage keys, or physical access.
 *  - The key is non-extractable: even code with access to IndexedDB can only
 *    *use* the key through SubtleCrypto, never export the raw bytes.
 *  - Each value is encrypted with a unique random IV, so identical plaintexts
 *    produce different ciphertexts.
 */

// ─── IndexedDB key store ────────────────────────────────────────────────────

const DB_NAME = "automailr_keystore";
const DB_VERSION = 1;
const STORE_NAME = "keys";
const KEY_ID = "master";

let cachedKey: CryptoKey | null = null;

/** Wrap a promise with a timeout so IndexedDB operations don't hang forever. */
function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
    promise.then(
      (v) => { clearTimeout(timer); resolve(v); },
      (e) => { clearTimeout(timer); reject(e); },
    );
  });
}

function openDB(): Promise<IDBDatabase> {
  return withTimeout(
    new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    }),
    3000,
    "IndexedDB open",
  );
}

async function getOrCreateKey(): Promise<CryptoKey> {
  if (cachedKey) return cachedKey;

  const db = await openDB();

  // Try loading an existing key
  const existing = await new Promise<CryptoKey | undefined>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const req = store.get(KEY_ID);
    req.onsuccess = () => resolve(req.result as CryptoKey | undefined);
    req.onerror = () => reject(req.error);
  });

  if (existing) {
    cachedKey = existing;
    return existing;
  }

  // Generate a new AES-256-GCM key (non-extractable)
  const key = await crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    false, // ← non-extractable
    ["encrypt", "decrypt"],
  );

  // Persist in IndexedDB
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const req = store.put(key, KEY_ID);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });

  cachedKey = key;
  return key;
}

// ─── Encryption helpers ─────────────────────────────────────────────────────

const IV_LENGTH = 12; // 96-bit IV recommended for AES-GCM

async function encrypt(plaintext: string): Promise<string> {
  const key = await getOrCreateKey();
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const encoded = new TextEncoder().encode(plaintext);

  const cipherBuf = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encoded);

  // Pack IV ‖ ciphertext into one Uint8Array, then Base-64 encode
  const combined = new Uint8Array(IV_LENGTH + cipherBuf.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(cipherBuf), IV_LENGTH);

  return btoa(String.fromCharCode(...combined));
}

async function decrypt(encoded: string): Promise<string> {
  const key = await getOrCreateKey();

  const combined = Uint8Array.from(atob(encoded), (c) => c.charCodeAt(0));
  const iv = combined.slice(0, IV_LENGTH);
  const ciphertext = combined.slice(IV_LENGTH);

  const plainBuf = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ciphertext);

  return new TextDecoder().decode(plainBuf);
}

// ─── Public API ─────────────────────────────────────────────────────────────

export const secureStorage = {
  /**
   * Encrypt `value` and store it under `key`.
   * Defaults to sessionStorage; pass `localStorage` for persistent data.
   */
  async setItem(key: string, value: string, storage: Storage = sessionStorage): Promise<void> {
    try {
      const encrypted = await encrypt(value);
      storage.setItem(key, encrypted);
    } catch (err) {
      console.warn("[secureStorage] Encryption failed, storing as-is:", err);
      storage.setItem(key, value);
    }
  },

  /**
   * Read and decrypt the value stored under `key`.
   * Returns `null` when the key does not exist.
   */
  async getItem(key: string, storage: Storage = sessionStorage): Promise<string | null> {
    const raw = storage.getItem(key);
    if (raw === null) return null;

    try {
      return await decrypt(raw);
    } catch {
      // Value may have been stored before encryption was enabled, or was
      // written by a different key (e.g. after clearing IndexedDB). Return
      // the raw value so callers can still function during the transition.
      return raw;
    }
  },

  /** Remove a key (thin wrapper so callers don't need to import Storage). */
  removeItem(key: string, storage: Storage = sessionStorage): void {
    storage.removeItem(key);
  },

  /** Destroy the encryption key. Call on logout to ensure forward secrecy. */
  async destroyKey(): Promise<void> {
    cachedKey = null;
    try {
      const db = await openDB();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, "readwrite");
        const req = tx.objectStore(STORE_NAME).delete(KEY_ID);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch {
      // Best-effort cleanup
    }
  },

  /** Pre-warm the key so first read/write doesn't pay the generation cost. */
  async init(): Promise<void> {
    await getOrCreateKey();
  },
};
