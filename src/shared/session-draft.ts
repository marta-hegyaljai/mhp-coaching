export const SESSION_DRAFT_PREFIX = "mhp.session-draft:";

export type SessionDraftEnvelope<T> = {
  savedAt: number;
  value: T;
};

export type SessionDraftStorage = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
  key(index: number): string | null;
  readonly length: number;
};

export function sessionDraftStorageKey(scope: string): string {
  return `${SESSION_DRAFT_PREFIX}${scope}`;
}

export function getSessionDraftStorage(): SessionDraftStorage | null {
  try {
    if (typeof window === "undefined" || !window.sessionStorage) {
      return null;
    }

    return window.sessionStorage;
  } catch {
    return null;
  }
}

export function readSessionDraft<T>(
  scope: string,
  isValue: (value: unknown) => value is T,
  {
    maxAgeMs,
    now = Date.now,
    storage = getSessionDraftStorage(),
  }: {
    maxAgeMs: number;
    now?: () => number;
    storage?: SessionDraftStorage | null;
  },
): T | null {
  if (!storage || maxAgeMs <= 0) {
    return null;
  }

  const raw = safeGet(storage, sessionDraftStorageKey(scope));
  if (!raw) {
    return null;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    safeRemove(storage, sessionDraftStorageKey(scope));
    return null;
  }

  if (!isEnvelope(parsed) || !isValue(parsed.value)) {
    safeRemove(storage, sessionDraftStorageKey(scope));
    return null;
  }

  if (now() - parsed.savedAt > maxAgeMs) {
    safeRemove(storage, sessionDraftStorageKey(scope));
    return null;
  }

  return parsed.value;
}

export function writeSessionDraft<T>(
  scope: string,
  value: T,
  {
    now = Date.now,
    storage = getSessionDraftStorage(),
  }: {
    now?: () => number;
    storage?: SessionDraftStorage | null;
  } = {},
): void {
  if (!storage) {
    return;
  }

  const envelope: SessionDraftEnvelope<T> = {
    savedAt: now(),
    value,
  };

  try {
    storage.setItem(sessionDraftStorageKey(scope), JSON.stringify(envelope));
  } catch {
    // Private mode or a full session store should not break typing.
  }
}

export function clearSessionDraft(
  scope: string,
  storage: SessionDraftStorage | null = getSessionDraftStorage(),
): void {
  if (!storage) {
    return;
  }

  safeRemove(storage, sessionDraftStorageKey(scope));
}

export function clearSessionDraftsByPrefix(
  scopePrefix: string,
  storage: SessionDraftStorage | null = getSessionDraftStorage(),
): void {
  if (!storage) {
    return;
  }

  const fullPrefix = sessionDraftStorageKey(scopePrefix);
  const keys: string[] = [];

  for (let index = 0; index < storage.length; index += 1) {
    const key = storage.key(index);
    if (key?.startsWith(fullPrefix)) {
      keys.push(key);
    }
  }

  for (const key of keys) {
    safeRemove(storage, key);
  }
}

function isEnvelope(value: unknown): value is SessionDraftEnvelope<unknown> {
  if (!value || typeof value !== "object") {
    return false;
  }

  const record = value as {savedAt?: unknown; value?: unknown};
  return typeof record.savedAt === "number" && Number.isFinite(record.savedAt);
}

function safeGet(storage: SessionDraftStorage, key: string): string | null {
  try {
    return storage.getItem(key);
  } catch {
    return null;
  }
}

function safeRemove(storage: SessionDraftStorage, key: string): void {
  try {
    storage.removeItem(key);
  } catch {
    // Ignore quota / privacy-mode failures.
  }
}
