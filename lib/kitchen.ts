import {
  calculateHouse,
  type CuisineFit,
  type FrictionId,
  type House,
  type RegionId,
  type ServiceStyle,
} from "@/lib/customers";
import { DISHES, INGREDIENTS, dishesFor, tasteFor, type Course, type Dish } from "@/lib/pantry";

export type WealthId = "poor" | "modest" | "comfortable" | "well-off" | "rich";
export type ConflictId = "none" | "shakedown" | "unpaid" | "unlicensed" | "riot" | "hype" | "backed";
export type WeekAnswer = "yes" | "maybe" | "no";

export type KitchenChoices = {
  name: string;
  ingredient: string;
  dish: string;
  region: RegionId;
  rivals: number;
  reputation: number;
  wealth: WealthId;
  conflict: ConflictId;
  roll: number;
  week: WeekAnswer;
  seats: number;
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

export const WEEKS: { id: WeekAnswer; label: string }[] = [
  { id: "yes", label: "Yes" },
  { id: "maybe", label: "Maybe" },
  { id: "no", label: "No" },
];

const REGIONS: RegionId[] = ["vin", "mi", "pomodoro", "scones", "pimiento", "port", "fast-food"];
const WEALTH_IDS = new Set(WEALTH.map((item) => item.id));
const CONFLICT_IDS = new Set(CONFLICTS.map((item) => item.id));
const WEEK_IDS = new Set(WEEKS.map((item) => item.id));
const INGREDIENT_IDS = new Set(INGREDIENTS.map((item) => item.id));

export function exampleChoices(): KitchenChoices {
  return {
    name: "Evening service",
    ingredient: "shellfish",
    dish: "shellfish-stew",
    region: "port",
    rivals: 3,
    reputation: 0,
    wealth: "modest",
    conflict: "none",
    roll: 16,
    week: "yes",
    seats: 300,
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, Math.floor(value)));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function sanitizeChoices(input: unknown): KitchenChoices | null {
  if (!isRecord(input)) return null;
  const base = exampleChoices();
  const ingredient =
    typeof input.ingredient === "string" && INGREDIENT_IDS.has(input.ingredient) ? input.ingredient : base.ingredient;
  const menu = dishesFor(ingredient);
  const requestedDish = typeof input.dish === "string" ? input.dish : base.dish;
  const dish = menu.some((item) => item.id === requestedDish) ? requestedDish : menu[0].id;
  const region =
    typeof input.region === "string" && REGIONS.includes(input.region as RegionId)
      ? (input.region as RegionId)
      : base.region;
  return {
    name: typeof input.name === "string" ? input.name.slice(0, 60) : base.name,
    ingredient,
    dish,
    region,
    rivals: clamp(typeof input.rivals === "number" ? input.rivals : base.rivals, 0, 40),
    reputation: clamp(typeof input.reputation === "number" ? input.reputation : base.reputation, 0, 20),
    wealth:
      typeof input.wealth === "string" && WEALTH_IDS.has(input.wealth as WealthId)
        ? (input.wealth as WealthId)
        : base.wealth,
    conflict:
      typeof input.conflict === "string" && CONFLICT_IDS.has(input.conflict as ConflictId)
        ? (input.conflict as ConflictId)
        : base.conflict,
    roll: clamp(typeof input.roll === "number" ? input.roll : base.roll, 0, 40),
    week:
      typeof input.week === "string" && WEEK_IDS.has(input.week as WeekAnswer) ? (input.week as WeekAnswer) : base.week,
    seats: clamp(typeof input.seats === "number" ? input.seats : base.seats, 0, 100000),
  };
}

export function choicesFromHouse(house: House): KitchenChoices {
  return sanitizeChoices(house.choices) ?? { ...exampleChoices(), region: house.region, seats: house.capacity, roll: house.checkTotal, rivals: house.competitors };
}

function courseOf(dish: Dish): { menuTier: number; service: ServiceStyle } {
  const table: Record<Course, { menuTier: number; service: ServiceStyle }> = {
    street: { menuTier: 2, service: "grab" },
    tavern: { menuTier: 3, service: "casual" },
    fine: { menuTier: 5, service: "fine" },
  };
  return table[dish.course];
}

export function toHouse(choices: KitchenChoices): House {
  const clean = sanitizeChoices(choices) ?? exampleChoices();
  const dish = DISHES.find((item) => item.id === clean.dish) ?? dishesFor(clean.ingredient)[0];
  const ingredient = INGREDIENTS.find((item) => item.id === clean.ingredient);
  const wealth = WEALTH.find((item) => item.id === clean.wealth) ?? WEALTH[1];
  const conflict = CONFLICTS.find((item) => item.id === clean.conflict) ?? CONFLICTS[0];
  const course = courseOf(dish);
  const fit: CuisineFit = tasteFor(clean.region, clean.ingredient);
  const venues = Array.from({ length: clean.rivals }, (_, index) => ({
    id: `rival-${index + 1}`,
    name: `Rival ${index + 1}`,
    open: true,
  }));

  return {
    name: clean.name.trim() || "Evening service",
    region: clean.region,
    cuisine: fit,
    cuisineName: dish.name,
    menuTier: course.menuTier,
    districtTier: wealth.district,
    checkTotal: clean.roll,
    slumpDays: clean.region === "pomodoro" && clean.roll < 10 ? 1 : 0,
    favoredIngredient: clean.week === "yes" || clean.week === "maybe",
    ingredientName: ingredient?.name ?? "Food",
    wantedDish: clean.week === "yes",
    dishName: dish.name,
    venues,
    competitors: clean.rivals,
    system: "neutral",
    service: course.service,
    friction: conflict.friction,
    capacity: clean.seats,
    trafficWealth: wealth.value,
    ...(conflict.id === "none" ? {} : { systemValue: conflict.system }),
    ...(clean.reputation > 0 ? { reputationBonus: clean.reputation } : {}),
    choices: { ...clean },
  };
}

export function kitchenCount(choices: KitchenChoices) {
  return calculateHouse(toHouse(choices));
}

export function rollLine(roll: number, region: RegionId): string {
  if (region === "pomodoro" && roll < 10) {
    return `A roll of ${roll} is a bad plate. Pomodoro holds that against the kitchen.`;
  }
  if (roll < 10) return `A roll of ${roll} is a rough service.`;
  if (roll < 15) return `A roll of ${roll} is a normal cooking or charisma check.`;
  if (roll < 20) return `A roll of ${roll} brings people back.`;
  return `A roll of ${roll} fills the room with talk.`;
}
