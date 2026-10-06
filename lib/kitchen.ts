import {
  FRICTIONS,
  REGIONS,
  SERVICES,
  calculateHouse,
  cuisineMultiplier,
  famePull,
  priceMultiplier,
  roundTo,
  type CuisineFit,
  type FrictionId,
  type House,
  type RegionId,
  type ServiceStyle,
} from "@/lib/customers";
import { formatCount } from "@/lib/format";
import {
  DISHES,
  INGREDIENTS,
  dishesForIngredients,
  tasteFor,
  type ApplianceId,
  type Course,
  type Dish,
} from "@/lib/pantry";

export type WealthId = "poor" | "modest" | "comfortable" | "well-off" | "rich";
export type ConflictId = "none" | "shakedown" | "unpaid" | "unlicensed" | "riot" | "hype" | "backed";
export type WeekAnswer = "yes" | "maybe" | "no";

export type KitchenChoices = {
  name: string;
  ingredients: string[];
  dishes: string[];
  regions: RegionId[];
  rivals: number;
  reputation: number;
  wealths: WealthId[];
  conflicts: ConflictId[];
  roll: number;
  week: WeekAnswer;
  seats: number;
  appliances: ApplianceId[];
  menuSize: number;
};

export const WEALTH: { id: WealthId; label: string; detail: string; value: number; district: number }[] = [
  { id: "poor", label: "Poor", detail: "Copper coins and thin bowls.", value: 1.05, district: 1 },
  { id: "modest", label: "Modest", detail: "Working people with a coin to spare.", value: 1.2, district: 2 },
  { id: "comfortable", label: "Comfortable", detail: "Regulars who can sit a while.", value: 1.75, district: 3 },
  { id: "well-off", label: "Well-off", detail: "Silver on the table.", value: 2.5, district: 4 },
  { id: "rich", label: "Rich", detail: "They pay for the room as much as the plate.", value: 5, district: 6 },
];

export const CONFLICTS: { id: ConflictId; label: string; detail: string; system: number; friction: FrictionId }[] = [
  { id: "none", label: "Nothing going on", detail: "The street is just hungry.", system: 1, friction: "normal" },
  { id: "shakedown", label: "Cartel shakedown", detail: "Collectors are at the door.", system: 1, friction: "shakedown" },
  { id: "unpaid", label: "Cartel not paid", detail: "The house is unaligned.", system: 0.35, friction: "normal" },
  { id: "unlicensed", label: "Outsiders not trusted", detail: "The city is sour on unlicensed kitchens.", system: 1, friction: "unlicensed" },
  { id: "riot", label: "Riot in the streets", detail: "People are not stopping to eat.", system: 0.4, friction: "normal" },
  { id: "hype", label: "A crowd is being whipped up", detail: "Someone is pushing this kitchen.", system: 1.4, friction: "normal" },
  { id: "backed", label: "A powerful backer", detail: "A patron is holding the door open.", system: 1.2, friction: "normal" },
];

export const APPLIANCES: {
  id: ApplianceId;
  label: string;
  detail: string;
}[] = [
  { id: "stove", label: "Stove", detail: "Stews, soups, and porridge." },
  { id: "countertop", label: "Countertop cooker", detail: "Griddle food." },
  { id: "fryer", label: "Deep fryer", detail: "Fried plates." },
  { id: "oven", label: "Oven", detail: "Bread, pies, and roasts." },
  { id: "ice", label: "Ice storage", detail: "Cold platters and boards." },
  { id: "larder", label: "Larder", detail: "Dry storage for ingredients." },
];

export const WEEKS: { id: WeekAnswer; label: string }[] = [
  { id: "yes", label: "Yes" },
  { id: "maybe", label: "Maybe" },
  { id: "no", label: "No" },
];

const REGION_IDS: RegionId[] = ["vin", "mi", "pomodoro", "scones", "pimiento", "port", "fast-food"];
const WEALTH_IDS = WEALTH.map((item) => item.id);
const CONFLICT_IDS = CONFLICTS.map((item) => item.id);
const WEEK_IDS = new Set(WEEKS.map((item) => item.id));
const INGREDIENT_IDS = INGREDIENTS.map((item) => item.id);
const APPLIANCE_IDS = APPLIANCES.map((item) => item.id);

export function dishLimit(menuSize: number): number {
  if (!Number.isFinite(menuSize)) return 0;
  return Math.min(40, Math.max(0, Math.floor(menuSize)));
}

export function exampleChoices(): KitchenChoices {
  return {
    name: "Evening service",
    ingredients: ["shellfish"],
    dishes: ["shellfish-stew"],
    regions: ["port"],
    rivals: 3,
    reputation: 0,
    wealths: ["modest"],
    conflicts: ["none"],
    roll: 16,
    week: "yes",
    seats: 300,
    appliances: ["stove"],
    menuSize: 4,
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, Math.floor(value)));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function unique<T extends string>(items: T[]): T[] {
  return [...new Set(items)];
}

function pickIds<T extends string>(value: unknown, allowed: readonly T[], fallback: T[]): T[] {
  const raw = Array.isArray(value) ? value : typeof value === "string" ? [value] : [];
  const allowedSet = new Set<string>(allowed);
  const next = unique(raw.filter((item): item is T => typeof item === "string" && allowedSet.has(item)));
  return next.length > 0 ? next : fallback;
}

export function sanitizeChoices(input: unknown): KitchenChoices | null {
  if (!isRecord(input)) return null;
  const base = exampleChoices();
  const ingredients = pickIds(
    Array.isArray(input.ingredients) ? input.ingredients : input.ingredient,
    INGREDIENT_IDS,
    base.ingredients,
  );
  const menu = dishesForIngredients(ingredients);
  const menuIds = new Set(menu.map((item) => item.id));
  const requestedDishes = Array.isArray(input.dishes) ? input.dishes : input.dish;
  const dishRaw = Array.isArray(requestedDishes) ? requestedDishes : typeof requestedDishes === "string" ? [requestedDishes] : [];
  const requested = unique(dishRaw.filter((item): item is string => typeof item === "string" && menuIds.has(item)));
  const appliances = Array.isArray(input.appliances)
    ? unique(
        input.appliances.filter((item): item is ApplianceId => typeof item === "string" && APPLIANCE_IDS.includes(item as ApplianceId)),
      )
    : inferAppliances(requested);
  const cookable = new Set(menu.filter((dish) => appliances.includes(dish.appliance)).map((dish) => dish.id));
  const roll = clamp(typeof input.roll === "number" ? input.roll : base.roll, 0, 40);
  const menuSize = dishLimit(typeof input.menuSize === "number" ? input.menuSize : base.menuSize);
  const dishes = requested.filter((id) => cookable.has(id)).slice(0, menuSize);
  const regions = pickIds(
    Array.isArray(input.regions) ? input.regions : input.region,
    REGION_IDS,
    base.regions,
  );
  const wealths = pickIds(Array.isArray(input.wealths) ? input.wealths : input.wealth, WEALTH_IDS, base.wealths);
  let conflicts = pickIds(
    Array.isArray(input.conflicts) ? input.conflicts : input.conflict,
    CONFLICT_IDS,
    base.conflicts,
  );
  if (conflicts.includes("none") && conflicts.length > 1) {
    conflicts = conflicts.filter((item) => item !== "none");
  }
  return {
    name: typeof input.name === "string" ? input.name.slice(0, 60) : base.name,
    ingredients,
    dishes,
    regions,
    rivals: clamp(typeof input.rivals === "number" ? input.rivals : base.rivals, 0, 40),
    reputation: clamp(typeof input.reputation === "number" ? input.reputation : base.reputation, 0, 20),
    wealths,
    conflicts,
    roll,
    week:
      typeof input.week === "string" && WEEK_IDS.has(input.week as WeekAnswer) ? (input.week as WeekAnswer) : base.week,
    seats: clamp(typeof input.seats === "number" ? input.seats : base.seats, 0, 100000),
    appliances,
    menuSize,
  };
}

function inferAppliances(dishIds: readonly string[]): ApplianceId[] {
  const needed = unique(
    dishIds
      .map((id) => DISHES.find((dish) => dish.id === id)?.appliance)
      .filter((id): id is ApplianceId => Boolean(id)),
  );
  return needed.length > 0 ? needed : ["stove"];
}

export function choicesFromHouse(house: House): KitchenChoices {
  return (
    sanitizeChoices(house.choices) ?? {
      ...exampleChoices(),
      regions: [house.region],
      seats: house.capacity,
      roll: house.checkTotal,
      rivals: house.competitors,
    }
  );
}

function courseOf(dish: Dish): { menuTier: number; service: ServiceStyle } {
  const table: Record<Course, { menuTier: number; service: ServiceStyle }> = {
    street: { menuTier: 2, service: "grab" },
    tavern: { menuTier: 3, service: "casual" },
    fine: { menuTier: 5, service: "fine" },
  };
  return table[dish.course];
}

function mean(values: number[]): number {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function frictionOf(id: FrictionId): number {
  return FRICTIONS.find((item) => item.id === id)?.value ?? 1;
}

function serviceOf(service: ServiceStyle): number {
  return SERVICES.find((item) => item.id === service)?.value ?? 1;
}

function fitForDish(region: RegionId, ingredients: readonly string[]): CuisineFit {
  let best: CuisineFit = "neutral";
  let bestValue = -1;
  for (const id of ingredients) {
    const fit = tasteFor(region, id);
    const value = cuisineMultiplier(region, fit);
    if (value > bestValue) {
      best = fit;
      bestValue = value;
    }
  }
  return best;
}

export function toHouse(choices: KitchenChoices): House {
  const clean = sanitizeChoices(choices) ?? exampleChoices();
  const selectedDishes = clean.dishes
    .map((id) => DISHES.find((item) => item.id === id))
    .filter((item): item is Dish => Boolean(item));
  const wealthItems = clean.wealths
    .map((id) => WEALTH.find((item) => item.id === id))
    .filter((item): item is (typeof WEALTH)[number] => Boolean(item));
  const wealth = wealthItems[0] ?? WEALTH[1];
  const wealthValue = wealthItems.length === 1 ? wealth.value : mean(wealthItems.map((item) => item.value));
  const realConflicts = clean.conflicts
    .filter((id) => id !== "none")
    .map((id) => CONFLICTS.find((item) => item.id === id))
    .filter((item): item is (typeof CONFLICTS)[number] => Boolean(item));
  const conflict = realConflicts[0];
  const region = clean.regions[0];
  const venues = Array.from({ length: clean.rivals }, (_, index) => ({
    id: `rival-${index + 1}`,
    name: `Rival ${index + 1}`,
    open: true,
  }));
  if (selectedDishes.length === 0) {
    return {
      name: clean.name.trim() || "Evening service",
      region,
      cuisine: "neutral",
      cuisineName: "Nothing on the fire",
      menuTier: 2,
      districtTier: wealth.district,
      checkTotal: clean.roll,
      slumpDays: 0,
      favoredIngredient: false,
      ingredientName: "Nothing",
      wantedDish: false,
      dishName: "Nothing",
      venues,
      competitors: clean.rivals,
      system: "neutral",
      service: "casual",
      friction: "normal",
      capacity: clean.seats,
      bEffOverride: 0,
      choices: { ...clean },
    };
  }
  const dish = selectedDishes[0];
  const course = courseOf(dish);
  const fit: CuisineFit = fitForDish(region, dish.ingredients);
  const mixedRegions = clean.regions.length > 1;
  const mixedDishes = selectedDishes.length > 1;
  const mixedWealth = wealthItems.length > 1;
  const cuisineSamples: number[] = [];
  const priceSamples: { value: number; note: string | null }[] = [];
  for (const plate of selectedDishes) {
    const plateCourse = courseOf(plate);
    for (const regionId of clean.regions) {
      cuisineSamples.push(cuisineMultiplier(regionId, fitForDish(regionId, plate.ingredients)));
      for (const band of wealthItems) {
        priceSamples.push(priceMultiplier(regionId, plateCourse.menuTier, band.district));
      }
    }
  }
  const priceNotes = [...new Set(priceSamples.map((sample) => sample.note).filter((note): note is string => Boolean(note)))];
  const averagedWealth = mean(wealthItems.map((item) => item.value));
  const slump = clean.regions.includes("pomodoro") && clean.roll < 10;

  return {
    name: clean.name.trim() || "Evening service",
    region,
    cuisine: fit,
    cuisineName: selectedDishes.map((item) => item.name).join(", ") || dish.name,
    menuTier: course.menuTier,
    districtTier: wealth.district,
    checkTotal: clean.roll,
    slumpDays: slump ? 1 : 0,
    favoredIngredient: clean.week === "yes" || clean.week === "maybe",
    ingredientName: clean.ingredients
      .map((id) => INGREDIENTS.find((item) => item.id === id)?.name)
      .filter((name): name is string => Boolean(name))
      .join(", "),
    wantedDish: clean.week === "yes",
    dishName: dish.name,
    venues,
    competitors: clean.rivals,
    system: "neutral",
    service: course.service,
    friction: conflict?.friction ?? "normal",
    capacity: clean.seats,
    trafficWealth: wealthValue,
    ...(realConflicts.length === 0 ? {} : { systemValue: roundTo(realConflicts.reduce((product, item) => product * item.system, 1), 4) }),
    ...(realConflicts.length > 1
      ? { frictionFactor: roundTo(realConflicts.reduce((product, item) => product * frictionOf(item.friction), 1), 4) }
      : {}),
    ...(mixedDishes || mixedRegions
      ? { cuisineValue: roundTo(mean(cuisineSamples), 2) }
      : {}),
    ...(mixedDishes || mixedRegions || mixedWealth
      ? {
          priceValue: roundTo(mean(priceSamples.map((sample) => sample.value)), 2),
          priceNote: priceNotes.length > 0 ? priceNotes.join(" ") : null,
        }
      : {}),
    ...(mixedDishes
      ? { serviceFactor: roundTo(mean(selectedDishes.map((item) => serviceOf(courseOf(item).service))), 2) }
      : {}),
    ...(mixedRegions
      ? {
          bEffOverride: Math.round(
            mean(
              clean.regions.map((id) => Math.round(REGIONS[id].base * (1 + Math.log(averagedWealth)))),
            ),
          ),
          lambdaOverride: roundTo(mean(clean.regions.map((id) => REGIONS[id].lambda)), 4),
          crMaxOverride: roundTo(mean(clean.regions.map((id) => REGIONS[id].crMax)), 4),
        }
      : {}),
    ...(slump && region !== "pomodoro"
      ? {
          reputationValue: 0.2,
          reputationNote: "Pomodoro slump. Reputation stays at 0.20 for 1 more day.",
        }
      : clean.reputation > 0
        ? { reputationBonus: clean.reputation }
        : {}),
    choices: { ...clean },
  };
}

export function kitchenCount(choices: KitchenChoices) {
  const clean = sanitizeChoices(choices) ?? exampleChoices();
  if (clean.dishes.length === 0) {
    const quiet = calculateHouse(toHouse(clean));
    return {
      ...quiet,
      interest: 0,
      attracted: 0,
      served: 0,
      turnedAway: 0,
      cr: 0,
      headline: "Nothing is on the fire.",
      detail: "This kitchen cannot cook a dish from the book tonight.",
    };
  }
  if (clean.dishes.length === 1 && clean.ingredients.length <= 1) {
    return calculateHouse(toHouse(clean));
  }
  const parts = clean.dishes.map((id) => calculateHouse(toHouse({ ...clean, dishes: [id] })));
  const primary = parts[0];
  const dishInterest = parts.slice(1).reduce((sum, part) => sum + Math.max(1, part.interest), primary.interest);
  const extraIngredients = Math.max(0, clean.ingredients.length - 1);
  const bonus = extraIngredients * Math.max(1, Math.round(primary.interest * 0.05));
  const interest = dishInterest + bonus;
  const attracted = Math.floor(roundTo(interest * primary.cr, 4));
  const served = Math.min(clean.seats, Math.max(0, attracted));
  const turnedAway = Math.max(0, attracted - served);
  const slump = clean.regions.includes("pomodoro") && clean.roll < 10;
  const fame = slump ? 1 : famePull(clean.reputation);
  const packed = fame >= 2 && served === clean.seats && turnedAway > 0;
  const headline = packed
    ? "The name packs the street."
    : served === clean.seats && turnedAway > 0
      ? "Fully booked."
      : attracted === 0
        ? "The street walks past."
        : "There is still room.";
  const detail = packed
    ? `${formatCount(served)} paying customers. ${formatCount(turnedAway)} more heard the name and could not get a seat.`
    : turnedAway > 0
      ? `${formatCount(served)} paying customers. ${formatCount(turnedAway)} turned away.`
      : `${formatCount(served)} paying customers. A longer menu brings a bigger crowd.`;
  return { ...primary, interest, attracted, served, turnedAway, headline, detail };
}

export function rollLine(roll: number, regions: readonly RegionId[]): string {
  if (regions.includes("pomodoro") && roll < 10) {
    return `A roll of ${roll} is a bad plate. Pomodoro holds that against the kitchen.`;
  }
  if (roll < 10) return `A roll of ${roll} is a rough service.`;
  if (roll < 15) return `A roll of ${roll} is a normal cooking or charisma check.`;
  if (roll < 20) return `A roll of ${roll} brings people back.`;
  return `A roll of ${roll} fills the room with talk.`;
}
