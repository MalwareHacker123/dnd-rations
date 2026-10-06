import { exampleHouse, sanitizeHouse, type House } from "@/lib/customers";

const KEY = "quartermaster-house-v1";

export function loadHouse(): House | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    return sanitizeHouse(JSON.parse(raw) as unknown);
  } catch {
    return null;
  }
}

export function saveHouse(house: House): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(house));
  } catch {
    // Private mode or a full disk should not block the sheet.
  }
}

const listeners = new Set<() => void>();
const serverSnapshot = exampleHouse();
let snapshot: House | null = null;
let loaded = false;

export function subscribeHouse(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getHouseSnapshot(): House {
  if (!loaded) {
    snapshot = loadHouse() ?? serverSnapshot;
    loaded = true;
  }
  return snapshot ?? serverSnapshot;
}

export function getServerHouseSnapshot(): House {
  return serverSnapshot;
}

export function setHouseSnapshot(house: House): void {
  snapshot = sanitizeHouse(house) ?? house;
  loaded = true;
  saveHouse(snapshot);
  for (const listener of listeners) listener();
}
