import { exampleChoices, sanitizeChoices, type KitchenChoices } from "@/lib/kitchen";

const KEY = "quartermaster-kitchen-v1";

function load(): KitchenChoices | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    return sanitizeChoices(JSON.parse(raw) as unknown);
  } catch {
    return null;
  }
}

function persist(choices: KitchenChoices): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(choices));
  } catch {
    // A full browser store should not block the count.
  }
}

const listeners = new Set<() => void>();
const serverSnapshot = exampleChoices();
let snapshot: KitchenChoices | null = null;
let loaded = false;

export function subscribeKitchen(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getKitchenSnapshot(): KitchenChoices {
  if (!loaded) {
    snapshot = load() ?? serverSnapshot;
    loaded = true;
  }
  return snapshot ?? serverSnapshot;
}

export function getServerKitchenSnapshot(): KitchenChoices {
  return serverSnapshot;
}

export function setKitchenSnapshot(choices: KitchenChoices): void {
  snapshot = sanitizeChoices(choices) ?? choices;
  loaded = true;
  persist(snapshot);
  for (const listener of listeners) listener();
}
