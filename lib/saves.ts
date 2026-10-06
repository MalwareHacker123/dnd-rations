import { sanitizeHouse, type House } from "@/lib/customers";
import { sanitizeTrip } from "@/lib/storage";
import type { Trip } from "@/lib/types";

export type SavedSheet = {
  id: string;
  name: string;
  savedAt: string;
  trip: Trip;
  house: House;
};

export const SHEET_KIND = "quartermaster-sheet";
export const SHEET_VERSION = 1;
const KEY = "quartermaster-saves-v1";
export const SAVE_LIMIT = 24;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function sheetFrom(value: unknown, requireKind: boolean): SavedSheet | null {
  if (!isRecord(value)) return null;
  if (requireKind && (value.kind !== SHEET_KIND || value.version !== SHEET_VERSION)) return null;
  const trip = sanitizeTrip(value.trip);
  const house = sanitizeHouse(value.house);
  if (!trip || !house) return null;
  const rawName = typeof value.name === "string" ? value.name.trim().slice(0, 60) : "";
  const id = typeof value.id === "string" && value.id.trim() ? value.id.trim().slice(0, 80) : crypto.randomUUID();
  const savedAt = typeof value.savedAt === "string" && value.savedAt ? value.savedAt : new Date().toISOString();
  return {
    id,
    name: rawName || house.name || "Untitled sheet",
    savedAt,
    trip,
    house,
  };
}

export function parseSheetText(text: string): SavedSheet | null {
  try {
    return sheetFrom(JSON.parse(text) as unknown, true);
  } catch {
    return null;
  }
}

export function serializeSheet(sheet: SavedSheet): string {
  return JSON.stringify(
    {
      kind: SHEET_KIND,
      version: SHEET_VERSION,
      id: sheet.id,
      name: sheet.name,
      savedAt: sheet.savedAt,
      trip: sheet.trip,
      house: sheet.house,
    },
    null,
    2,
  );
}

export function sheetFilename(name: string): string {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
  return `${slug || "quartermaster-sheet"}.json`;
}

export function upsertSave(library: SavedSheet[], sheet: SavedSheet): SavedSheet[] {
  const without = library.filter((entry) => entry.id !== sheet.id && entry.name !== sheet.name);
  return [sheet, ...without].slice(0, SAVE_LIMIT);
}

export function loadSaves(): SavedSheet[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    const sheets: SavedSheet[] = [];
    for (const entry of parsed) {
      const sheet = sheetFrom(entry, false);
      if (sheet) sheets.push(sheet);
    }
    return sheets.slice(0, SAVE_LIMIT);
  } catch {
    return [];
  }
}

function persist(sheets: SavedSheet[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(sheets));
  } catch {
    // The live sheet still works if the named list cannot be stored.
  }
}

const listeners = new Set<() => void>();
const serverSnapshot: SavedSheet[] = [];
let snapshot: SavedSheet[] = serverSnapshot;
let loaded = false;

export function subscribeSaves(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getSaveSnapshot(): SavedSheet[] {
  if (!loaded) {
    snapshot = loadSaves();
    loaded = true;
  }
  return snapshot;
}

export function getServerSaveSnapshot(): SavedSheet[] {
  return serverSnapshot;
}

export function setSaveSnapshot(sheets: SavedSheet[]): void {
  snapshot = sheets.slice(0, SAVE_LIMIT);
  loaded = true;
  persist(snapshot);
  for (const listener of listeners) listener();
}
