import { formatCount, formatFixed } from "@/lib/format";

export type RegionId = "vin" | "mi" | "pomodoro" | "scones" | "pimiento" | "port" | "fast-food";

export type CuisineFit = "favorite" | "neutral" | "exotic" | "taboo";

export type ServiceStyle = "grab" | "casual" | "fine";

export type FrictionId = "normal" | "shakedown" | "unlicensed";

export type SystemId =
  | "neutral"
  | "cartel-paid"
  | "unaligned"
  | "mega-corp"
  | "independent"
  | "hype"
  | "riot";

export type Venue = {
  id: string;
  name: string;
  open: boolean;
};

export type House = {
  name: string;
  region: RegionId;
  cuisine: CuisineFit;
  cuisineName: string;
  menuTier: number;
  districtTier: number;
  checkTotal: number;
  slumpDays: number;
  favoredIngredient: boolean;
  ingredientName: string;
  wantedDish: boolean;
  dishName: string;
  venues: Venue[];
  competitors: number;
  system: SystemId;
  service: ServiceStyle;
  friction: FrictionId;
  capacity: number;
};

export type FactorLine = {
  id: string;
  on: boolean;
  label: string;
  effect: string;
};

export type HouseMath = {
  bEff: number;
  bRegion: number;
  wealth: number;
  mCuisine: number;
  mPrice: number;
  priceNote: string | null;
  mRep: number;
  repNote: string | null;
  mWeekly: number;
  weights: { cuisine: number; price: number; rep: number; weekly: number };
  aFood: number;
  lambda: number;
  competitors: number;
  factors: FactorLine[];
  mSystem: number;
  decay: number;
  eMarket: number;
  interest: number;
  crMax: number;
  expTerm: number;
  sigmoid: number;
  fService: number;
  fFriction: number;
  cr: number;
  attracted: number;
  served: number;
  turnedAway: number;
  capacity: number;
  headline: string;
  detail: string;
};

type SystemOption = {
  id: SystemId;
  label: string;
  detail: string;
  value: number;
};

export type Region = {
  id: RegionId;
  name: string;
  base: number;
  wealth: number;
  wealthLabel: string;
  bEff: number;
  lambda: number;
  crMax: number;
  districtTier: number;
  reality: string;
  systems: SystemOption[];
};

const NEUTRAL: SystemOption = {
  id: "neutral",
  label: "Neutral baseline",
  detail: "No cartel, corporation, or riot is moving the count.",
  value: 1,
};

export const REGIONS: Record<RegionId, Region> = {
  vin: {
    id: "vin",
    name: "Vin Region",
    base: 300,
    wealth: 5,
    wealthLabel: "Infinite",
    bEff: 782,
    lambda: 0.08,
    crMax: 0.2,
    districtTier: 6,
    reality: "Reservations and exclusivity filter out most of the people who walk by.",
    systems: [NEUTRAL],
  },
  mi: {
    id: "mi",
    name: "Mi Region",
    base: 1200,
    wealth: 2.5,
    wealthLabel: "Upper-Mid",
    bEff: 2300,
    lambda: 0.25,
    crMax: 0.6,
    districtTier: 4,
    reality: "A sit-down meal. People commit once they like the board.",
    systems: [NEUTRAL],
  },
  pomodoro: {
    id: "pomodoro",
    name: "Pomodoro",
    base: 2000,
    wealth: 1.75,
    wealthLabel: "Middle",
    bEff: 3119,
    lambda: 0.25,
    crMax: 0.6,
    districtTier: 3,
    reality: "A sit-down meal. A bad cook's name sticks for days.",
    systems: [NEUTRAL],
  },
  scones: {
    id: "scones",
    name: "Scones",
    base: 1500,
    wealth: 1.35,
    wealthLabel: "Lower-Mid",
    bEff: 1950,
    lambda: 0.15,
    crMax: 0.5,
    districtTier: 3,
    reality: "Factional distrust keeps casual visitors outside.",
    systems: [
      {
        id: "mega-corp",
        label: "Mega-corp backed",
        detail: "One of the three corporations is standing behind the house.",
        value: 1.2,
      },
      {
        id: "independent",
        label: "Independent",
        detail: "No corporate patron. Scones treats the house as an outsider.",
        value: 0.65,
      },
    ],
  },
  pimiento: {
    id: "pimiento",
    name: "Pimiento",
    base: 3500,
    wealth: 1.15,
    wealthLabel: "Lower",
    bEff: 3989,
    lambda: 0.15,
    crMax: 0.75,
    districtTier: 2,
    reality: "Street dining. People decide quickly.",
    systems: [
      {
        id: "cartel-paid",
        label: "Cartel paid",
        detail: "The house is aligned, so the street stays open.",
        value: 1,
      },
      {
        id: "unaligned",
        label: "Unaligned",
        detail: "The cartel has not been paid.",
        value: 0.35,
      },
    ],
  },
  port: {
    id: "port",
    name: "Port District",
    base: 4500,
    wealth: 1.2,
    wealthLabel: "Lower-Mid",
    bEff: 5320,
    lambda: 0.15,
    crMax: 0.75,
    districtTier: 2,
    reality: "High-volume street dining. A menu above tier 3 looks like a scam.",
    systems: [NEUTRAL],
  },
  "fast-food": {
    id: "fast-food",
    name: "Fast Food",
    base: 6000,
    wealth: 1.05,
    wealthLabel: "Lowest",
    bEff: 6293,
    lambda: 0.08,
    crMax: 0.95,
    districtTier: 1,
    reality: "Impulse buying. A sponsored hype week can fill the counter.",
    systems: [
      {
        id: "hype",
        label: "Brand-sponsored hype",
        detail: "The brand is pushing this house right now.",
        value: 1.4,
      },
      {
        id: "riot",
        label: "Local worker riot",
        detail: "The street is shut down by a riot.",
        value: 0.4,
      },
    ],
  },
};

export const REGION_ORDER: RegionId[] = [
  "vin",
  "mi",
  "pomodoro",
  "scones",
  "pimiento",
  "port",
  "fast-food",
];

export const CUISINES: { id: CuisineFit; label: string; detail: string }[] = [
  { id: "favorite", label: "Regional favorite", detail: "The dish this district already wants." },
  { id: "neutral", label: "Secondary / neutral", detail: "Familiar, but not the local favorite." },
  { id: "exotic", label: "Exotic / unfavored", detail: "Strange here. Mi Region is less harsh." },
  { id: "taboo", label: "Rejected / taboo", detail: "The culture will not eat this." },
];

export const SERVICES: { id: ServiceStyle; label: string; detail: string; value: number }[] = [
  { id: "grab", label: "Grab-and-go", detail: "A bag, and they are gone.", value: 1.2 },
  { id: "casual", label: "Casual seating", detail: "A table, no ceremony.", value: 1 },
  { id: "fine", label: "Fine dining", detail: "A full course slows the door.", value: 0.75 },
];

export const FRICTIONS: { id: FrictionId; label: string; detail: string; value: number }[] = [
  { id: "normal", label: "Normal", detail: "The door is just a door.", value: 1 },
  { id: "shakedown", label: "Cartel shakedown", detail: "A shakedown is happening right now.", value: 0.4 },
  {
    id: "unlicensed",
    label: "Unlicensed in Scones",
    detail: "Anti-corporate and unlicensed. Scones makes entry harder.",
    value: 0.7,
  },
];

const REGION_IDS = new Set<string>(REGION_ORDER);
const CUISINE_IDS = new Set<string>(CUISINES.map((item) => item.id));
const SERVICE_IDS = new Set<string>(SERVICES.map((item) => item.id));
const FRICTION_IDS = new Set<string>(FRICTIONS.map((item) => item.id));

export function roundTo(value: number, digits: number): number {
  const scale = 10 ** digits;
  return Math.round(value * scale) / scale;
}

// The worked sheet writes 0.75 / 1.2894 as 0.5816, which keeps the first four decimals.
function truncTo(value: number, digits: number): number {
  const scale = 10 ** digits;
  const scaled = value * scale;
  const cut = value >= 0 ? Math.floor(scaled + 1e-8) : Math.ceil(scaled - 1e-8);
  return cut / scale;
}

export function exampleVenues(): Venue[] {
  return [
    { id: "salt-wharf", name: "Salt Wharf", open: true },
    { id: "net-and-nail", name: "Net and Nail", open: true },
    { id: "red-lamp", name: "Red Lamp", open: true },
  ];
}

export function exampleHouse(): House {
  return {
    name: "Italian Seafood Bistro",
    region: "port",
    cuisine: "favorite",
    cuisineName: "Seafood",
    menuTier: 3,
    districtTier: 2,
    checkTotal: 16,
    slumpDays: 0,
    favoredIngredient: true,
    ingredientName: "Clams",
    wantedDish: true,
    dishName: "Cioppino",
    venues: exampleVenues(),
    competitors: 3,
    system: "neutral",
    service: "casual",
    friction: "normal",
    capacity: 300,
  };
}

export function competingCount(house: Pick<House, "venues">): number {
  return house.venues.filter((venue) => venue.open).length;
}

function clampInt(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, Math.floor(value)));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function textField(value: unknown, fallback: string): string {
  return typeof value === "string" ? value.slice(0, 60) : fallback;
}

function venuesFrom(value: unknown, fallbackCount: number): Venue[] {
  if (Array.isArray(value)) {
    const venues: Venue[] = [];
    for (const [index, entry] of value.entries()) {
      if (!isRecord(entry) || venues.length >= 12) continue;
      const id =
        typeof entry.id === "string" && entry.id.trim() ? entry.id.trim().slice(0, 80) : `venue-${index + 1}`;
      const name = typeof entry.name === "string" ? entry.name.slice(0, 60) : "";
      venues.push({ id, name, open: entry.open !== false });
    }
    return venues;
  }
  const count = clampInt(fallbackCount, 0, 12);
  return Array.from({ length: count }, (_, index) => ({
    id: `competitor-${index + 1}`,
    name: `Competitor ${index + 1}`,
    open: true,
  }));
}

export function systemFor(region: RegionId, system: SystemId): SystemOption {
  const options = REGIONS[region].systems;
  return options.find((option) => option.id === system) ?? options[0];
}

export function sanitizeHouse(input: unknown): House | null {
  if (!isRecord(input)) return null;
  const base = exampleHouse();
  const region =
    typeof input.region === "string" && REGION_IDS.has(input.region)
      ? (input.region as RegionId)
      : base.region;
  const requested = typeof input.system === "string" ? (input.system as SystemId) : base.system;
  const cuisine =
    typeof input.cuisine === "string" && CUISINE_IDS.has(input.cuisine)
      ? (input.cuisine as CuisineFit)
      : base.cuisine;
  const service =
    typeof input.service === "string" && SERVICE_IDS.has(input.service)
      ? (input.service as ServiceStyle)
      : base.service;
  const friction =
    typeof input.friction === "string" && FRICTION_IDS.has(input.friction)
      ? (input.friction as FrictionId)
      : base.friction;
  const name = typeof input.name === "string" ? input.name.slice(0, 80) : base.name;
  const venues = venuesFrom(
    input.venues,
    typeof input.competitors === "number" ? input.competitors : base.competitors,
  );

  return {
    name,
    region,
    cuisine,
    cuisineName: textField(input.cuisineName, base.cuisineName),
    ingredientName: textField(input.ingredientName, base.ingredientName),
    dishName: textField(input.dishName, base.dishName),
    venues,
    menuTier: clampInt(typeof input.menuTier === "number" ? input.menuTier : base.menuTier, 1, 6),
    districtTier: clampInt(
      typeof input.districtTier === "number" ? input.districtTier : REGIONS[region].districtTier,
      1,
      6,
    ),
    checkTotal: clampInt(typeof input.checkTotal === "number" ? input.checkTotal : base.checkTotal, 0, 40),
    slumpDays: clampInt(typeof input.slumpDays === "number" ? input.slumpDays : 0, 0, 6),
    favoredIngredient: input.favoredIngredient === true,
    wantedDish: input.wantedDish === true,
    competitors: venues.filter((venue) => venue.open).length,
    system: systemFor(region, requested).id,
    service,
    friction,
    capacity: clampInt(typeof input.capacity === "number" ? input.capacity : base.capacity, 0, 100000),
  };
}

export function cuisineMultiplier(region: RegionId, cuisine: CuisineFit): number {
  if (cuisine === "favorite") return 1.5;
  if (cuisine === "neutral") return 1;
  if (cuisine === "taboo") return 0.2;
  return region === "mi" ? 0.85 : 0.6;
}

export function priceMultiplier(
  region: RegionId,
  menuTier: number,
  districtTier: number,
): { value: number; note: string | null } {
  if (region === "port" && menuTier > 3) {
    return { value: 0.1, note: "Scam penalty. Port District punishes a menu above tier 3." };
  }
  if (region === "vin" && menuTier < 5) {
    return { value: 0.05, note: "Exclusivity failure. Vin Region rejects a menu under tier 5." };
  }
  const gap = Math.abs(menuTier - districtTier);
  return { value: roundTo(1.3 - 0.35 * gap * gap, 2), note: null };
}

export function reputationMultiplier(
  region: RegionId,
  checkTotal: number,
  slumpDays: number,
): { value: number; note: string | null } {
  if (region === "pomodoro" && (checkTotal < 10 || slumpDays > 0)) {
    const days = slumpDays > 0 ? slumpDays : null;
    return {
      value: 0.2,
      note:
        days === null
          ? "A check under 10 starts a Pomodoro slump. Roll 1d6 and set the days."
          : `Pomodoro slump. Reputation stays at 0.20 for ${days} more ${days === 1 ? "day" : "days"}.`,
    };
  }
  return { value: roundTo(0.5 + checkTotal / 20, 2), note: null };
}

function serviceValue(service: ServiceStyle): number {
  return SERVICES.find((item) => item.id === service)?.value ?? 1;
}

function frictionValue(friction: FrictionId): number {
  return FRICTIONS.find((item) => item.id === friction)?.value ?? 1;
}

function headlineFor(served: number, attracted: number, capacity: number): { headline: string; detail: string } {
  const turned = Math.max(0, attracted - served);
  if (capacity === 0 && attracted > 0) {
    return {
      headline: "Nowhere to seat them.",
      detail: `${formatCount(attracted)} people try the door, and the house has no seats.`,
    };
  }
  if (attracted === 0) {
    return { headline: "The street walks past.", detail: "Nobody tries to come in." };
  }
  if (served === capacity && turned > 0) {
    return {
      headline: "Fully booked.",
      detail: `${formatCount(served)} paying customers. ${formatCount(turned)} turned away.`,
    };
  }
  const open = Math.max(0, capacity - served);
  return {
    headline: "There is still room.",
    detail: `${formatCount(served)} paying customers, with ${formatCount(open)} ${open === 1 ? "seat" : "seats"} open.`,
  };
}

export function calculateHouse(house: House): HouseMath {
  const region = REGIONS[house.region];
  const mCuisine = cuisineMultiplier(house.region, house.cuisine);
  const price = priceMultiplier(house.region, house.menuTier, house.districtTier);
  const rep = reputationMultiplier(house.region, house.checkTotal, house.slumpDays);
  const ingredient = house.favoredIngredient ? 1 : 0;
  const dish = house.wantedDish ? 1 : 0;
  const weeklyIngredient = 0.2 * ingredient;
  const weeklyDish = 0.25 * dish;
  const weeklySynergy = 0.15 * ingredient * dish;
  const mWeekly = roundTo(1 + weeklyIngredient + weeklyDish + weeklySynergy, 2);
  const competitors = competingCount(house);
  const weights = {
    cuisine: roundTo(0.35 * mCuisine, 3),
    price: roundTo(0.3 * price.value, 3),
    rep: roundTo(0.2 * rep.value, 3),
    weekly: roundTo(0.15 * mWeekly, 3),
  };
  const aFood = roundTo(weights.cuisine + weights.price + weights.rep + weights.weekly, 2);
  const mSystem = systemFor(house.region, house.system).value;
  const decay = roundTo(Math.exp(-region.lambda * competitors), 4);
  const eMarket = roundTo(decay * mSystem, 4);
  const appealSquare = roundTo(aFood * aFood, 4);
  const interest = Math.floor(roundTo(region.bEff * appealSquare * eMarket, 4));
  const expTerm = roundTo(Math.exp(-4 * (aFood - 1)), 4);
  const sigmoid = truncTo(region.crMax / (1 + expTerm), 4);
  const fService = serviceValue(house.service);
  const fFriction = frictionValue(house.friction);
  const cr = roundTo(sigmoid * fService * fFriction, 4);
  const attracted = Math.floor(roundTo(interest * cr, 4));
  const served = Math.min(house.capacity, Math.max(0, attracted));
  const turnedAway = Math.max(0, attracted - served);
  const copy = headlineFor(served, attracted, house.capacity);
  const cuisineLabel = house.cuisineName.trim() || "Cuisine";
  const ingredientLabel = house.ingredientName.trim() || "Favored ingredient";
  const dishLabel = house.dishName.trim() || "Wanted dish";
  const service = SERVICES.find((item) => item.id === house.service) ?? SERVICES[1];
  const friction = FRICTIONS.find((item) => item.id === house.friction) ?? FRICTIONS[0];
  const system = systemFor(house.region, house.system);
  const factors: FactorLine[] = [
    {
      id: "traffic",
      on: true,
      label: `${region.name} baseline`,
      effect: `${formatCount(region.bEff)} passers-by from base ${formatCount(region.base)} and wealth ${formatFixed(region.wealth, 2)}`,
    },
    {
      id: "cuisine",
      on: true,
      label: `${cuisineLabel} · ${CUISINES.find((item) => item.id === house.cuisine)?.label ?? "Cuisine"}`,
      effect: `Cuisine ${formatFixed(mCuisine, 2)} adds ${formatFixed(weights.cuisine, 3)} to appeal`,
    },
    {
      id: "price",
      on: true,
      label: `Menu tier ${house.menuTier} against district tier ${house.districtTier}`,
      effect: price.note
        ? `${price.note} Price factor ${formatFixed(price.value, 2)}.`
        : `Price factor ${formatFixed(price.value, 2)} adds ${formatFixed(weights.price, 3)} to appeal`,
    },
    {
      id: "reputation",
      on: true,
      label: rep.note ? "Cook's reputation" : `Check ${house.checkTotal}`,
      effect: rep.note
        ? rep.note
        : `Reputation ${formatFixed(rep.value, 2)} adds ${formatFixed(weights.rep, 3)} to appeal`,
    },
    {
      id: "ingredient",
      on: house.favoredIngredient,
      label: ingredientLabel,
      effect: house.favoredIngredient ? "Weekly ingredient box adds 0.20" : "Weekly ingredient box is off, so it adds 0",
    },
    {
      id: "dish",
      on: house.wantedDish,
      label: dishLabel,
      effect: house.wantedDish ? "Weekly dish box adds 0.25" : "Weekly dish box is off, so it adds 0",
    },
    {
      id: "synergy",
      on: house.favoredIngredient && house.wantedDish,
      label: "Both weekly boxes",
      effect:
        house.favoredIngredient && house.wantedDish
          ? "Synergy adds another 0.15"
          : "Synergy stays at 0 until both weekly boxes are checked",
    },
    ...house.venues.map((venue) => ({
      id: `venue-${venue.id}`,
      on: venue.open,
      label: venue.name.trim() || "Unnamed rival",
      effect: venue.open
        ? `Open rival. Counts in the ${formatCount(competitors)} competing venues.`
        : "Closed. This rival does not count.",
    })),
    {
      id: "system",
      on: true,
      label: system.label,
      effect: `System multiplier ${formatFixed(system.value, 2)}`,
    },
    {
      id: "service",
      on: true,
      label: service.label,
      effect: `Service factor ${formatFixed(service.value, 2)}`,
    },
    {
      id: "friction",
      on: house.friction !== "normal",
      label: friction.label,
      effect:
        house.friction === "normal"
          ? "No extra friction. Factor 1.00"
          : `Friction factor ${formatFixed(friction.value, 2)}`,
    },
  ];

  return {
    bEff: region.bEff,
    bRegion: region.base,
    wealth: region.wealth,
    mCuisine,
    mPrice: price.value,
    priceNote: price.note,
    mRep: rep.value,
    repNote: rep.note,
    mWeekly,
    weights,
    aFood,
    lambda: region.lambda,
    competitors,
    factors,
    mSystem,
    decay,
    eMarket,
    interest,
    crMax: region.crMax,
    expTerm,
    sigmoid,
    fService,
    fFriction,
    cr,
    attracted,
    served,
    turnedAway,
    capacity: house.capacity,
    headline: copy.headline,
    detail: copy.detail,
  };
}
