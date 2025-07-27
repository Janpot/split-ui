const subscriptions = new Map<string, Set<() => void>>();
const subscribes = new Map<string, (cb: () => void) => () => void>();

const PERSISTENT_ID_PREFIX = "p:";
const GENERATED_ID_PREFIX = "g:";
const LOCAL_STORAGE_PREFIX = "--rfp-";

export interface StorePanelInfo {
  flexValues: Record<string, string>;
}

export const HYDRATE_SCRIPT = `
(() => {
  const groupElm = document.currentScript.parentElement;
  const groupId = groupElm.dataset.groupId;
  const localStorageId = ${JSON.stringify(LOCAL_STORAGE_PREFIX)} + groupId;
  const storedValue = window.localStorage.getItem(localStorageId);
  if (storedValue) {
    const parsedValue = JSON.parse(storedValue);
    for (const [childId, flexValue] of Object.entries(parsedValue.flexValues)) {
      groupElm.style.setProperty('--rfp-flex-' + childId, flexValue);
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

export function getGetSnapshot(id: string): () => StorePanelInfo | undefined {
  let getSnapshot = getGetSnapshots.get(id);
  if (!getSnapshot) {
    getSnapshot = () => {
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
