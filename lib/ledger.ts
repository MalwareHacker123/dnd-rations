import { FOOD_PLANS, MOUNTS, VEHICLES, WATER_PACKS } from "@/lib/catalog";
import type {
  FoodPlan,
  GearItem,
  HaulStatus,
  MountLine,
  Problem,
  SpellUse,
  Trip,
  VehicleId,
  WaterPack,
} from "@/lib/types";

const RATION_LB = 2;
const RATION_CP = 50;
const WATER_LB_PER_GALLON = 8;
const FEED_LB = 10;
const FEED_CP = 5;
const SPELL_PEOPLE = 15;
const SPELL_STEEDS = 5;

export type Ledger = {
  days: number;
  eaters: number;
  haulers: number;
  animalCount: number;
  gallonsPerDay: number;
  lbPerPersonDay: number;
  food: {
    pounds: number;
    packsNeeded: number;
    packsToBuy: number;
    weightLb: number;
    costCp: number;
    plan: FoodPlan;
  };
  water: {
    gallons: number;
    count: number;
    singular: string;
    weightLb: number;
    costCp: number;
    pack: WaterPack;
    wornCount: number;
    stowedLb: number;
  };
  feed: {
    feedDays: number;
    weightLb: number;
    costCp: number;
    coveredBySpell: number;
  };
  gear: {
    weightLb: number;
    costCp: number;
    capacityLb: number;
  };
  purchases: {
    costCp: number;
  };
  totals: {
    weightLb: number;
    costCp: number;
    stowNeedLb: number;
    stowHaveLb: number;
    stowShortLb: number;
  };
  haul: {
    partyMax: number;
    partyEnc: number;
    partyHeavy: number;
    looseMountLb: number;
    pullLb: number;
    wagonCargoLb: number;
    vehicleLb: number;
    onWagon: number;
    onMounts: number;
    onParty: number;
    status: HaulStatus;
  };
  problems: Problem[];
};

function clamp(value: number, min: number, max: number, fallback: number): number {
  if (!Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, value));
}

function whole(value: number, min: number, max: number, fallback: number): number {
  return Math.floor(clamp(value, min, max, fallback));
}

function lbPerDay(plan: FoodPlan): number {
  return FOOD_PLANS.find((entry) => entry.id === plan)?.lbPerDay ?? 2;
}

function personDays(eaters: number, days: number, spell: SpellUse): number {
  if (spell !== "party") return eaters * days;
  const covered = Math.min(SPELL_PEOPLE, eaters);
  const uncovered = eaters - covered;
  return covered * Math.min(days, 1) + uncovered * days;
}

function packsForPounds(pounds: number): number {
  if (pounds <= 0) return 0;
  const exact = Math.round(pounds * 1000) / 1000;
  return Math.ceil(exact / RATION_LB);
}

function activeMounts(mounts: MountLine[], vehicle: VehicleId) {
  let loose = 0;
  let harnessBase = 0;
  let count = 0;
  let harnessed = 0;
  for (const line of mounts) {
    const quantity = whole(line.quantity, 0, 999, 0);
    if (quantity === 0) continue;
    count += quantity;
    const capacity = MOUNTS[line.id].capacityLb * quantity;
    if (vehicle !== "none" && line.harnessed) {
      harnessBase += capacity;
      harnessed += quantity;
    } else {
      loose += capacity;
    }
  }
  return { loose, harnessBase, count, harnessed };
}

function waterLoad(gallons: number, pack: WaterPack, wearers: number) {
  const spec = WATER_PACKS[pack];
  const count = gallons <= 0 ? 0 : Math.ceil(gallons / spec.holdGal);
  const waterLb = gallons * WATER_LB_PER_GALLON;
  const weightLb = spec.includesWater
    ? count * (spec.fullLb ?? 0)
    : count * spec.containerLb + waterLb;
  let wornCount = 0;
  let stowedLb = 0;
  if (pack === "waterskins") {
    wornCount = Math.min(count, Math.max(0, wearers) * 2);
    stowedLb = (count - wornCount) * (spec.fullLb ?? 0);
  } else if (pack !== "barrels") {
    stowedLb = weightLb;
  }
  return {
    gallons,
    count,
    singular: spec.singular,
    weightLb,
    costCp: count * spec.costCp,
    pack,
    wornCount,
    stowedLb,
  };
}

function sumGear(items: GearItem[]) {
  let weightLb = 0;
  let costCp = 0;
  let capacityLb = 0;
  let insideLb = 0;
  let strapLb = 0;
  let backpacks = 0;
  for (const item of items) {
    if (!item.packed) continue;
    const quantity = whole(item.quantity, 0, 9999, 0);
    if (quantity === 0) continue;
    const weight = clamp(item.weightLb, 0, 100000, 0) * quantity;
    const cost = clamp(item.costCp, 0, 100000000, 0) * quantity;
    weightLb += weight;
    costCp += cost;
    if (item.capacityLb) capacityLb += clamp(item.capacityLb, 0, 100000, 0) * quantity;
    if (item.id === "backpack") backpacks += quantity;
    if (item.stow === "inside") insideLb += weight;
    if (item.stow === "strap") strapLb += weight;
  }
  return {
    weightLb,
    costCp,
    capacityLb,
    stowLb: insideLb + (backpacks > 0 ? 0 : strapLb),
  };
}

export function calculate(trip: Trip): Ledger {
  const days = whole(trip.days, 0, 365, 0);
  const people = trip.people.map((person) => ({
    ...person,
    strength: whole(person.strength, 1, 30, 10),
  }));
  const eaters = people.filter((person) => person.eating).length;
  const haulers = people.filter((person) => person.hauling);
  const plan = trip.foodPlan;
  const spell = trip.spell;
  const carriedDays = personDays(eaters, days, spell);
  const pounds = carriedDays * lbPerDay(plan);
  const packsNeeded = packsForPounds(pounds);
  const rationsOwned = whole(trip.rationsOwned, 0, 9999, 0);
  const food = {
    pounds,
    packsNeeded,
    packsToBuy: Math.max(0, packsNeeded - rationsOwned),
    weightLb: packsNeeded * RATION_LB,
    costCp: Math.max(0, packsNeeded - rationsOwned) * RATION_CP,
    plan,
  };

  const gallonsPerDay = trip.hotWeather ? 2 : 1;
  const gallons = carriedDays * gallonsPerDay;
  const water = waterLoad(gallons, trip.waterPack, eaters);

  const animals = activeMounts(trip.mounts, trip.vehicle);
  let coveredBySpell = 0;
  let feedDays = 0;
  if (!trip.pasture && animals.count > 0 && days > 0) {
    if (spell === "animals") {
      coveredBySpell = Math.min(SPELL_STEEDS, animals.count);
      const uncovered = animals.count - coveredBySpell;
      feedDays = coveredBySpell * Math.min(days, 1) + uncovered * days;
    } else {
      feedDays = animals.count * days;
    }
  }
  const feed = {
    feedDays,
    weightLb: feedDays * FEED_LB,
    costCp: feedDays * FEED_CP,
    coveredBySpell,
  };

  const gear = sumGear([...trip.gear, ...trip.customGear]);
  const stowNeedLb = food.weightLb + feed.weightLb + gear.stowLb + water.stowedLb;

  let purchaseCp = 0;
  if (trip.includePurchases) {
    for (const line of trip.mounts) {
      const quantity = whole(line.quantity, 0, 999, 0);
      purchaseCp += MOUNTS[line.id].costCp * quantity;
    }
    purchaseCp += VEHICLES[trip.vehicle].costCp;
  }

  const weightLb = food.weightLb + water.weightLb + feed.weightLb + gear.weightLb;
  const partyMax = haulers.reduce((sum, person) => sum + person.strength * 15, 0);
  const partyEnc = haulers.reduce((sum, person) => sum + person.strength * 5, 0);
  const partyHeavy = haulers.reduce((sum, person) => sum + person.strength * 10, 0);
  const vehicle = VEHICLES[trip.vehicle];
  const pullLb = animals.harnessBase * 5;
  const wagonCargoLb =
    trip.vehicle === "none" || animals.harnessed === 0
      ? 0
      : Math.max(0, pullLb - vehicle.weightLb);

  let left = weightLb;
  const onWagon = Math.min(left, wagonCargoLb);
  left -= onWagon;
  const onMounts = Math.min(left, animals.loose);
  left -= onMounts;
  const onParty = left;

  let status: HaulStatus = "clear";
  if (onParty > partyMax) status = haulers.length === 0 ? "nowhere" : "over";
  else if (trip.variantEncumbrance && onParty > partyHeavy) status = "heavy";
  else if (trip.variantEncumbrance && onParty > partyEnc) status = "encumbered";

  const wagonHoldsStow = Math.min(onWagon, stowNeedLb);
  const stowShortLb = Math.max(0, stowNeedLb - wagonHoldsStow - gear.capacityLb);

  const problems: Problem[] = [];
  if (status === "over") problems.push("over");
  if (status === "nowhere") problems.push("nowhere");
  if (stowShortLb > 0) problems.push("stow");
  if (trip.vehicle !== "none" && animals.harnessed === 0 && (animals.count > 0 || weightLb > 0)) {
    problems.push("unhitched");
  }
  if (
    trip.vehicle !== "none" &&
    animals.harnessed > 0 &&
    pullLb < vehicle.weightLb
  ) {
    problems.push("too-weak");
  }
  if (trip.waterPack === "barrels" && water.weightLb > onWagon + onMounts && water.weightLb > 0) {
    problems.push("barrels");
  }

  return {
    days,
    eaters,
    haulers: haulers.length,
    animalCount: animals.count,
    gallonsPerDay,
    lbPerPersonDay: lbPerDay(plan),
    food,
    water,
    feed,
    gear: {
      weightLb: gear.weightLb,
      costCp: gear.costCp,
      capacityLb: gear.capacityLb,
    },
    purchases: { costCp: purchaseCp },
    totals: {
      weightLb,
      costCp: food.costCp + water.costCp + feed.costCp + gear.costCp + purchaseCp,
      stowNeedLb,
      stowHaveLb: gear.capacityLb + wagonHoldsStow,
      stowShortLb,
    },
    haul: {
      partyMax,
      partyEnc,
      partyHeavy,
      looseMountLb: animals.loose,
      pullLb,
      wagonCargoLb,
      vehicleLb: trip.vehicle === "none" ? 0 : vehicle.weightLb,
      onWagon,
      onMounts,
      onParty,
      status,
    },
    problems,
  };
}
