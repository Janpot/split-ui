import { LOCAL_STORAGE_PREFIX, CSS_PROP_CHILD_FLEX_PREFIX } from './constants';

const subscriptions = new Map<string, Set<() => void>>();
const snapshots = new Map<string, StorePanelInfo>();

const PERSISTENT_ID_PREFIX = 'p:';
const GENERATED_ID_PREFIX = 'g:';

export interface StorePanelInfo {
  flexValues: Record<string, string>;
}

export const HYDRATE_SCRIPT = `
(() => {
  const groupElm = document.currentScript.parentElement;
  const storedValue = window.localStorage.getItem(${JSON.stringify(LOCAL_STORAGE_PREFIX)} + groupElm.dataset.groupId);
  if (storedValue) {
    const parsedValue = JSON.parse(storedValue);
    for (const [childId, flexValue] of Object.entries(parsedValue.flexValues)) {
      groupElm.style.setProperty(${JSON.stringify(CSS_PROP_CHILD_FLEX_PREFIX)} + childId, flexValue);
    }
  }
})();
`;

export function createPanelId(id: string, persistent: boolean): string {
  return `${persistent ? PERSISTENT_ID_PREFIX : GENERATED_ID_PREFIX}${id}`;
}

export function isPersistentId(id: string): boolean {
  return id.startsWith(PERSISTENT_ID_PREFIX);
}

function getLocalStorageId(id: string): string {
  return `${LOCAL_STORAGE_PREFIX}${id}`;
}

export function subscribe(id: string, cb: () => void): () => void {
  let idSubscriptions = subscriptions.get(id);
  if (!idSubscriptions) {
    idSubscriptions = new Set();
    subscriptions.set(id, idSubscriptions);
  }
  idSubscriptions.add(cb);

  return () => {
    const idSubscriptions = subscriptions.get(id);
    if (idSubscriptions) {
      idSubscriptions.delete(cb);
      if (idSubscriptions.size === 0) {
        subscriptions.delete(id);
        if (!isPersistentId(id)) {
          snapshots.delete(id);
        }
      }
    }
  };
}

function parseSnapshot(value: string): StorePanelInfo {
  return JSON.parse(value);
}

function serializeSnapshot(snapshot: StorePanelInfo): string {
  return JSON.stringify(snapshot);
}

export function getSnapshot(id: string): StorePanelInfo | undefined {
  if (!snapshots.has(id)) {
    const storedStringValue = window.localStorage.getItem(
      getLocalStorageId(id),
    );
    if (storedStringValue) {
      const parsedSnapshot = parseSnapshot(storedStringValue);
      snapshots.set(id, parsedSnapshot);
      return parsedSnapshot;
    }
    return snapshots.get(id);
  }
  return snapshots.get(id);
}

function notifySubscribers(id: string): void {
  const idSubscriptions = subscriptions.get(id);
  if (idSubscriptions) {
    for (const cb of idSubscriptions) {
      cb();
    }
  }
}

export function setSnapshot(panelId: string, snapshot: StorePanelInfo): void {
  snapshots.set(panelId, snapshot);
  if (isPersistentId(panelId)) {
    window.localStorage.setItem(
      getLocalStorageId(panelId),
      serializeSnapshot(snapshot),
    );
  }
  notifySubscribers(panelId);
}

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key?.startsWith(LOCAL_STORAGE_PREFIX)) {
      const panelId = event.key.slice(LOCAL_STORAGE_PREFIX.length);
      const snapshot = event.newValue;
      if (snapshot !== null) {
        setSnapshot(panelId, parseSnapshot(snapshot));
      }
    }
  });
}
