const subscriptions = new Map<string, Set<() => void>>();
const subscribes = new Map<string, (cb: () => void) => () => void>();

const PERSISTENT_ID_PREFIX = "p:";
const GENERATED_ID_PREFIX = "g:";
const LOCAL_STORAGE_PREFIX = "--rfp-";

export interface StorePanelInfo {
  flexValue: string;
  percent: number | null;
}

export function getHydrateScript() {
  return `
for (const panel of document.currentScript.parentElement.querySelectorAll('& > .rfp-panel')) {
  const panelId = panel.dataset.panelId;
  const localStorageId = ${JSON.stringify(LOCAL_STORAGE_PREFIX)} + panelId;
  const val = window.localStorage.getItem(localStorageId);
  if (val) {
    panel.style.setProperty('--rfp-flex', JSON.parse(val).flexValue);
  }
}`;
}

export function createPanelId(id: string, persistent: boolean): string {
  return `${persistent ? PERSISTENT_ID_PREFIX : GENERATED_ID_PREFIX}${id}`;
}

export function isPersistentId(id: string): boolean {
  return id.startsWith(PERSISTENT_ID_PREFIX);
}

function getLocalStorageId(id: string): string {
  return `${LOCAL_STORAGE_PREFIX}${id}`;
}

export function getSubscribe(id: string): (cb: () => void) => () => void {
  let subscribe = subscribes.get(id);
  if (!subscribe) {
    subscribe = (cb: () => void) => {
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
          }
        }
      };
    };

    subscribes.set(id, subscribe);
  }
  return subscribe;
}

const snapshots = new Map<string, StorePanelInfo>();
const getGetSnapshots = new Map<string, () => StorePanelInfo | undefined>();

function parseSnapshot(value: string): StorePanelInfo {
  return JSON.parse(value);
}

function serializeSnapshot(snapshot: StorePanelInfo): string {
  return JSON.stringify(snapshot);
}

function getSnapshotFromLocalStorage(id: string): StorePanelInfo | undefined {
  const storedStringValue = window.localStorage.getItem(getLocalStorageId(id));
  if (storedStringValue) {
    return parseSnapshot(storedStringValue);
  }
  return undefined;
}

export function getGetSnapshot(id: string): () => StorePanelInfo | undefined {
  let getSnapshot = getGetSnapshots.get(id);
  if (!getSnapshot) {
    getSnapshot = () => {
      if (!snapshots.has(id) && isPersistentId(id)) {
        const storedSnapshot = getSnapshotFromLocalStorage(id);
        if (storedSnapshot) {
          snapshots.set(id, storedSnapshot);
          return storedSnapshot;
        }
        return snapshots.get(id);
      }
      return snapshots.get(id);
    };
    getGetSnapshots.set(id, getSnapshot);
  }
  return getSnapshot;
}

export function getServerSnapshot(): StorePanelInfo | undefined {
  return undefined;
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

if (typeof window !== "undefined") {
  window.addEventListener("storage", (event) => {
    if (event.key?.startsWith(LOCAL_STORAGE_PREFIX)) {
      const panelId = event.key.slice(LOCAL_STORAGE_PREFIX.length);
      const snapshot = event.newValue;
      if (snapshot !== null) {
        setSnapshot(panelId, parseSnapshot(snapshot));
      }
    }
  });
}

export function cleanup(panelId: string): void {
  if (!isPersistentId(panelId)) {
    snapshots.delete(panelId);
    subscribes.delete(panelId);
    getGetSnapshots.delete(panelId);
  }
}
