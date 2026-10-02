import {
  defaultGear,
  defaultMounts,
  gearById,
  MOUNT_ORDER,
  sampleTrip,
} from "@/lib/catalog";
import type {
  FoodPlan,
  GearItem,
  MountId,
  Person,
  SpellUse,
  Trip,
  VehicleId,
  WaterPack,
} from "@/lib/types";

const KEY = "quartermaster-trip-v1";

const FOOD_PLANS = new Set<FoodPlan>(["rations", "minimum", "half"]);
const WATER_PACKS = new Set<WaterPack>(["waterskins", "jugs", "barrels", "buckets"]);
const SPELLS = new Set<SpellUse>(["off", "party", "animals"]);
const VEHICLES = new Set<VehicleId>(["none", "cart", "wagon", "carriage", "sled"]);
const MOUNTS = new Set<MountId>(MOUNT_ORDER);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function numberOr(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function booleanOr(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function stringOr(value: unknown, fallback: string): string {
  return typeof value === "string" ? value : fallback;
}

function peopleFrom(value: unknown): Person[] | null {
  if (!Array.isArray(value)) return null;
  const people: Person[] = [];
  for (const entry of value) {
    if (!isRecord(entry)) continue;
    const id = stringOr(entry.id, "");
    if (!id) continue;
    people.push({
      id,
      name: stringOr(entry.name, "Adventurer").slice(0, 40),
      strength: numberOr(entry.strength, 10),
      eating: booleanOr(entry.eating, true),
      hauling: booleanOr(entry.hauling, true),
    });
  }
  return people;
}

function gearFlags(value: unknown): Map<string, { quantity: number; packed: boolean }> {
  const flags = new Map<string, { quantity: number; packed: boolean }>();
  if (!Array.isArray(value)) return flags;
  for (const entry of value) {
    if (!isRecord(entry) || typeof entry.id !== "string") continue;
    flags.set(entry.id, {
      quantity: numberOr(entry.quantity, 1),
      packed: booleanOr(entry.packed, false),
    });
  }
  return flags;
}

function customGearFrom(value: unknown): GearItem[] {
  if (!Array.isArray(value)) return [];
  const items: GearItem[] = [];
  for (const entry of value) {
    if (!isRecord(entry)) continue;
    const name = stringOr(entry.name, "").trim().slice(0, 60);
    const id = stringOr(entry.id, "");
    if (!name || !id) continue;
    items.push({
      id,
      name,
      detail: "Added on this sheet.",
      weightLb: Math.max(0, numberOr(entry.weightLb, 0)),
      costCp: Math.max(0, Math.round(numberOr(entry.costCp, 0))),
      group: "custom",
      stow: "inside",
      quantity: Math.max(0, Math.floor(numberOr(entry.quantity, 1))),
      packed: booleanOr(entry.packed, true),
    });
  }
  return items;
}

export function sanitizeTrip(input: unknown): Trip | null {
  if (!isRecord(input)) return null;
  const base = sampleTrip();
  const savedPeople = peopleFrom(input.people);
  const flags = gearFlags(input.gear);
  const catalog = gearById();
  const gear = defaultGear().map((item) => {
    const saved = flags.get(item.id);
    const template = catalog.get(item.id);
    if (!saved || !template) return item;
    return {
      ...template,
      quantity: saved.quantity,
      packed: saved.packed,
    };
  });

  const savedMounts = new Map<MountId, { quantity: number; harnessed: boolean }>();
  if (Array.isArray(input.mounts)) {
    for (const entry of input.mounts) {
      if (!isRecord(entry) || typeof entry.id !== "string" || !MOUNTS.has(entry.id as MountId)) {
        continue;
      }
      savedMounts.set(entry.id as MountId, {
        quantity: numberOr(entry.quantity, 0),
        harnessed: booleanOr(entry.harnessed, false),
      });
    }
  }
  const mounts = defaultMounts().map((line) => {
    const saved = savedMounts.get(line.id);
    return saved ? { id: line.id, ...saved } : line;
  });

  const foodPlan = input.foodPlan;
  const waterPack = input.waterPack;
  const spell = input.spell;
  const vehicle = input.vehicle;

  return {
    days: numberOr(input.days, base.days),
    hotWeather: booleanOr(input.hotWeather, base.hotWeather),
    foodPlan: typeof foodPlan === "string" && FOOD_PLANS.has(foodPlan as FoodPlan)
      ? (foodPlan as FoodPlan)
      : base.foodPlan,
    rationsOwned: numberOr(input.rationsOwned, base.rationsOwned),
    pasture: booleanOr(input.pasture, base.pasture),
    people: savedPeople ?? base.people,
    mounts,
    vehicle:
      typeof vehicle === "string" && VEHICLES.has(vehicle as VehicleId)
        ? (vehicle as VehicleId)
        : base.vehicle,
    gear,
    customGear: customGearFrom(input.customGear),
    waterPack:
      typeof waterPack === "string" && WATER_PACKS.has(waterPack as WaterPack)
        ? (waterPack as WaterPack)
        : base.waterPack,
    spell: typeof spell === "string" && SPELLS.has(spell as SpellUse) ? (spell as SpellUse) : base.spell,
    variantEncumbrance: booleanOr(input.variantEncumbrance, base.variantEncumbrance),
    includePurchases: booleanOr(input.includePurchases, base.includePurchases),
  };
}

export function loadTrip(): Trip | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    return sanitizeTrip(JSON.parse(raw) as unknown);
  } catch {
    return null;
  }
}

export function saveTrip(trip: Trip): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(trip));
  } catch {
    // Private mode or a full disk should not block the sheet.
  }
}

export function clearTrip(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // Ignore storage failures.
  }
}

const listeners = new Set<() => void>();
const serverSnapshot = sampleTrip();
let snapshot: Trip | null = null;
let loaded = false;

export function subscribeTrip(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getTripSnapshot(): Trip {
  if (!loaded) {
    snapshot = loadTrip() ?? serverSnapshot;
    loaded = true;
  }
  return snapshot ?? serverSnapshot;
}

export function getServerTripSnapshot(): Trip {
  return serverSnapshot;
}

export function setTripSnapshot(trip: Trip): void {
  snapshot = trip;
  loaded = true;
  saveTrip(trip);
  for (const listener of listeners) listener();
}
