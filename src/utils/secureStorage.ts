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
 *
 * Fails closed: nothing is ever written or returned in plaintext.
 *  - If encryption fails, `setItem` stores nothing (and drops any older value
 *    under that key) and rethrows, so callers can decide what to do.
 *  - If decryption fails (tampered value, plaintext left from an older build,
 *    or ciphertext from a key that has since been destroyed), `getItem`
 *    removes the stale item and returns `null`.
 */

// ─── IndexedDB key store ────────────────────────────────────────────────────

const DB_NAME = "automailr_keystore";
const DB_VERSION = 1;
const STORE_NAME = "keys";
const KEY_ID = "master";

/**
 * The key, or the in-flight load/creation of it. Caching the promise (not the
 * key) means concurrent first calls share one key instead of each generating
 * their own and leaving values encrypted under a key that IndexedDB no longer
 * holds.
 */
let keyPromise: Promise<CryptoKey> | null = null;

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

function getOrCreateKey(): Promise<CryptoKey> {
  if (!keyPromise) {
    keyPromise = loadOrCreateKey().catch((err: unknown) => {
      keyPromise = null; // let the next call retry
      throw err;
    });
  }
  return keyPromise;
}

async function loadOrCreateKey(): Promise<CryptoKey> {
  const db = await openDB();

  // Try loading an existing key
  const existing = await new Promise<CryptoKey | undefined>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const req = store.get(KEY_ID);
    req.onsuccess = () => resolve(req.result as CryptoKey | undefined);
    req.onerror = () => reject(req.error);
  });

  if (existing) return existing;

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

  return key;
}

// ─── Encryption helpers ─────────────────────────────────────────────────────

const IV_LENGTH = 12; // 96-bit IV recommended for AES-GCM

/**
 * Base-64 encode in chunks: spreading a large array into
 * `String.fromCharCode(...)` overflows the call stack (~100 KB+ values).
 */
function bytesToBase64(bytes: Uint8Array): string {
  const CHUNK = 0x8000;
  let binary = "";
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  return btoa(binary);
}

async function encrypt(plaintext: string): Promise<string> {
  const key = await getOrCreateKey();
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const encoded = new TextEncoder().encode(plaintext);

  const cipherBuf = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encoded);

  // Pack IV ‖ ciphertext into one Uint8Array, then Base-64 encode
  const combined = new Uint8Array(IV_LENGTH + cipherBuf.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(cipherBuf), IV_LENGTH);

  return bytesToBase64(combined);
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
   * Throws if encryption fails; nothing is stored in that case and any
   * previous value under `key` is removed so a stale value can't be read back.
   */
  async setItem(key: string, value: string, storage: Storage = sessionStorage): Promise<void> {
    let encrypted: string;
    try {
      encrypted = await encrypt(value);
    } catch (err) {
      storage.removeItem(key);
      throw err;
    }
    storage.setItem(key, encrypted);
  },

  /**
   * Read and decrypt the value stored under `key`.
   * Returns `null` when the key does not exist or the value can't be
   * decrypted (the undecryptable item is removed).
   */
  async getItem(key: string, storage: Storage = sessionStorage): Promise<string | null> {
    const raw = storage.getItem(key);
    if (raw === null) return null;

    try {
      return await decrypt(raw);
    } catch {
      // Tampered, plaintext from an older build, or encrypted with a key that
      // no longer exists. Never hand back the raw value.
      storage.removeItem(key);
      return null;
    }
  },

  /** Remove a key (thin wrapper so callers don't need to import Storage). */
  removeItem(key: string, storage: Storage = sessionStorage): void {
    storage.removeItem(key);
  },

  /** Destroy the encryption key. Call on logout to ensure forward secrecy. */
  async destroyKey(): Promise<void> {
    keyPromise = null;
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
