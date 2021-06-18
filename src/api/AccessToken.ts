import { XcapJsonResult } from './index';

export const ACCESS_TOKEN_RESULT_KEY = '__s';

/** Session storage key for access token */
export const ACCESS_TOKEN_SESSION_STORAGE_KEY = 'stackend-at';

/** Local storage key for extra data */
export const PERSISTENT_DATA_LOCAL_STORAGE_KEY = 'stackend-at';

export const ACCESS_TOKEN_PATH_SUFFIX = ';s=';

export interface PersistentData {
  [name: string]: any;
}

/** Access token */
export interface AccessToken {
  id: string;

  /** Creation date */
  created: number;

  /** Life time in milli seconds */
  ttl: number;

  /** additional data */
  data?: PersistentData;
}
/**
 * If an access token is received, add it to localStorage
 * @param result
 */
export function handleAccessToken(result: XcapJsonResult): void {
  const at = result[ACCESS_TOKEN_RESULT_KEY];
  if (typeof at === 'object' && typeof sessionStorage === 'object') {
    setAccessToken(at);
  }
}

/**
 * Set the access token. If null or undefined, remove it.
 * @param at
 */
export function setAccessToken(at: AccessToken | null | undefined): void {
  if (typeof sessionStorage !== 'object') {
    return;
  }

  if (at) {
    const x = { id: at.id, created: at.created, ttl: at.ttl };
    sessionStorage.setItem(ACCESS_TOKEN_SESSION_STORAGE_KEY, JSON.stringify(x));
    if (at.data) {
      updatePersistentData(at.data);
    }
  } else {
    sessionStorage.removeItem(ACCESS_TOKEN_SESSION_STORAGE_KEY);
  }
}

/**
 * Append the access token (if still valid) to the path
 * @param path
 */
export function appendAccessToken(path: string): string {
  const at = getAccessTokenValue();
  if (!at) {
    return path;
  }
  return path + ACCESS_TOKEN_PATH_SUFFIX + encodeURIComponent(at);
}

/**
 * Get the access token from local storage.
 */
export function getAccessToken(): AccessToken | undefined {
  if (typeof sessionStorage !== 'object') {
    return undefined; // Server side
  }

  const atS = sessionStorage.getItem(ACCESS_TOKEN_SESSION_STORAGE_KEY);
  return !atS ? undefined : JSON.parse(atS);
}

/**
 * Get the access token id
 */
export function getAccessTokenValue(): string | undefined {
  const at = getAccessToken();
  if (!at) {
    return undefined;
  }

  return at.id;
}

/**
 * Clear the access token
 */
export function clearAccessToken(): void {
  if (typeof sessionStorage === 'object') {
    sessionStorage.removeItem(ACCESS_TOKEN_SESSION_STORAGE_KEY);
  }
}

/**
 * Get the persistent data
 * @param key, optional key. Will get a single item
 */
export function getPersistentData(key?: string): PersistentData {
  if (typeof localStorage !== 'object') {
    return {}; // Server side
  }

  const s = localStorage.getItem(PERSISTENT_DATA_LOCAL_STORAGE_KEY);
  if (!s) {
    return {};
  }

  const p: PersistentData = JSON.parse(s);
  if (key) {
    return p[key];
  }
  return p;
}

/**
 * Update persistent data
 * @param pd
 */
export function updatePersistentData(pd: PersistentData): PersistentData {
  const r = Object.assign(getPersistentData(), pd || {});

  if (typeof localStorage === 'object') {
    localStorage.setItem(PERSISTENT_DATA_LOCAL_STORAGE_KEY, JSON.stringify(r));
  }

  return r;
}

/**
 * Remove an item from the persistent data
 * @param key
 */
export function removePersistentData(key: string): PersistentData | undefined {
  const r = Object.assign(getPersistentData());
  delete r[key];
  if (typeof localStorage === 'object') {
    localStorage.setItem(PERSISTENT_DATA_LOCAL_STORAGE_KEY, JSON.stringify(r));
  }
  return r;
}

/**
 * Set an item in the persistent storage
 * @param key
 * @param value
 */
export function setPersistentData(key: string, value: any): PersistentData | undefined {
  return updatePersistentData({ [key]: value });
}

/**
 * Clear all persistent data
 */
export function clearPersistentData(): void {
  if (typeof localStorage === 'object') {
    localStorage.removeItem(PERSISTENT_DATA_LOCAL_STORAGE_KEY);
  }
}
