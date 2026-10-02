import type {
  FoodPlan,
  GearItem,
  MountId,
  MountLine,
  Person,
  SpellUse,
  Trip,
  VehicleId,
  WaterPack,
} from "@/lib/types";

export const MOUNTS: Record<
  MountId,
  { name: string; capacityLb: number; costCp: number; speed: string }
> = {
  mule: { name: "Donkey or mule", capacityLb: 420, costCp: 800, speed: "40 ft." },
  pony: { name: "Pony", capacityLb: 225, costCp: 3000, speed: "40 ft." },
  "riding-horse": { name: "Riding horse", capacityLb: 480, costCp: 7500, speed: "60 ft." },
  "draft-horse": { name: "Draft horse", capacityLb: 540, costCp: 5000, speed: "40 ft." },
  warhorse: { name: "Warhorse", capacityLb: 540, costCp: 40000, speed: "60 ft." },
  camel: { name: "Camel", capacityLb: 480, costCp: 5000, speed: "50 ft." },
  mastiff: { name: "Mastiff", capacityLb: 195, costCp: 2500, speed: "40 ft." },
  elephant: { name: "Elephant", capacityLb: 1320, costCp: 20000, speed: "40 ft." },
};

export const MOUNT_ORDER: MountId[] = [
  "mule",
  "draft-horse",
  "riding-horse",
  "pony",
  "warhorse",
  "camel",
  "mastiff",
  "elephant",
];

export const VEHICLES: Record<
  VehicleId,
  { name: string; weightLb: number; costCp: number }
> = {
  none: { name: "No vehicle", weightLb: 0, costCp: 0 },
  cart: { name: "Cart", weightLb: 200, costCp: 1500 },
  wagon: { name: "Wagon", weightLb: 400, costCp: 3500 },
  carriage: { name: "Carriage", weightLb: 600, costCp: 10000 },
  sled: { name: "Sled", weightLb: 300, costCp: 2000 },
};

export const VEHICLE_ORDER: VehicleId[] = ["none", "cart", "wagon", "carriage", "sled"];

export const WATER_PACKS: Record<
  WaterPack,
  {
    name: string;
    singular: string;
    holdGal: number;
    containerLb: number;
    costCp: number;
    includesWater: boolean;
    fullLb?: number;
  }
> = {
  waterskins: {
    name: "Waterskins",
    singular: "waterskin",
    holdGal: 0.5,
    containerLb: 0,
    costCp: 20,
    includesWater: true,
    fullLb: 5,
  },
  jugs: {
    name: "Jugs",
    singular: "jug",
    holdGal: 1,
    containerLb: 4,
    costCp: 2,
    includesWater: false,
  },
  buckets: {
    name: "Buckets",
    singular: "bucket",
    holdGal: 3,
    containerLb: 2,
    costCp: 5,
    includesWater: false,
  },
  barrels: {
    name: "Barrels",
    singular: "barrel",
    holdGal: 40,
    containerLb: 70,
    costCp: 200,
    includesWater: false,
  },
};

export const WATER_ORDER: WaterPack[] = ["waterskins", "jugs", "buckets", "barrels"];

export const FOOD_PLANS: { id: FoodPlan; title: string; detail: string; lbPerDay: number }[] = [
  {
    id: "rations",
    title: "Ration packs",
    detail: "2 lb a person each day, the way rations are sold.",
    lbPerDay: 2,
  },
  {
    id: "minimum",
    title: "One pound",
    detail: "The daily minimum. One ration pack lasts two days.",
    lbPerDay: 1,
  },
  {
    id: "half",
    title: "Half rations",
    detail: "½ lb a day. That counts as half a day without food.",
    lbPerDay: 0.5,
  },
];

export const SPELL_USES: { id: SpellUse; title: string; detail: string }[] = [
  { id: "off", title: "No spell", detail: "Pack the whole trip." },
  {
    id: "party",
    title: "Feed the party",
    detail: "One casting a day, up to 15 people. Food spoils by the next dawn.",
  },
  {
    id: "animals",
    title: "Feed the animals",
    detail: "One casting a day covers up to 5 steeds, not the people.",
  },
];

export const GEAR_GROUPS: { id: GearItem["group"]; title: string; blurb: string }[] = [
  { id: "camp", title: "Camp", blurb: "Sleeping and cooking." },
  { id: "light", title: "Light", blurb: "A hooded lantern burns six hours on one flask of oil." },
  { id: "tools", title: "Tools", blurb: "Rope and a bedroll can be strapped to a backpack." },
  {
    id: "containers",
    title: "Containers",
    blurb: "Capacity is what they hold. Their own weight is extra.",
  },
  {
    id: "tack",
    title: "Tack",
    blurb: "Saddles sit on the animal. They are weight, not space in a pack.",
  },
];

const GEAR_TEMPLATE: Omit<GearItem, "quantity" | "packed">[] = [
  {
    id: "bedroll",
    name: "Bedroll",
    detail: "Can be strapped outside a backpack.",
    weightLb: 7,
    costCp: 100,
    group: "camp",
    stow: "strap",
  },
  {
    id: "blanket",
    name: "Blanket",
    detail: "Can be strapped outside a backpack.",
    weightLb: 3,
    costCp: 50,
    group: "camp",
    stow: "strap",
  },
  {
    id: "tent",
    name: "Tent, two-person",
    detail: "Sleeps two.",
    weightLb: 20,
    costCp: 200,
    group: "camp",
    stow: "inside",
  },
  {
    id: "mess-kit",
    name: "Mess kit",
    detail: "A tin plate, cup, and cutlery.",
    weightLb: 1,
    costCp: 20,
    group: "camp",
    stow: "inside",
  },
  {
    id: "tinderbox",
    name: "Tinderbox",
    detail: "Flint, fire steel, and tinder.",
    weightLb: 1,
    costCp: 50,
    group: "camp",
    stow: "inside",
  },
  {
    id: "torch",
    name: "Torch",
    detail: "Burns for 1 hour.",
    weightLb: 1,
    costCp: 1,
    group: "camp",
    stow: "inside",
  },
  {
    id: "lantern",
    name: "Lantern, hooded",
    detail: "Bright light 30 feet. Six hours per flask of oil.",
    weightLb: 2,
    costCp: 500,
    group: "light",
    stow: "inside",
  },
  {
    id: "oil",
    name: "Oil (flask)",
    detail: "One pint.",
    weightLb: 1,
    costCp: 10,
    group: "light",
    stow: "inside",
  },
  {
    id: "lamp",
    name: "Lamp",
    detail: "A smaller light than a lantern.",
    weightLb: 1,
    costCp: 50,
    group: "light",
    stow: "inside",
  },
  {
    id: "rope",
    name: "Rope, hempen (50 feet)",
    detail: "Can be strapped outside a backpack.",
    weightLb: 10,
    costCp: 100,
    group: "tools",
    stow: "strap",
  },
  {
    id: "rope-silk",
    name: "Rope, silk (50 feet)",
    detail: "Can be strapped outside a backpack.",
    weightLb: 5,
    costCp: 1000,
    group: "tools",
    stow: "strap",
  },
  {
    id: "grappling-hook",
    name: "Grappling hook",
    detail: "Thrown with a rope.",
    weightLb: 4,
    costCp: 200,
    group: "tools",
    stow: "inside",
  },
  {
    id: "pitons",
    name: "Pitons (10)",
    detail: "A quarter pound each.",
    weightLb: 2.5,
    costCp: 50,
    group: "tools",
    stow: "inside",
  },
  {
    id: "hammer",
    name: "Hammer",
    detail: "For pitons.",
    weightLb: 3,
    costCp: 100,
    group: "tools",
    stow: "inside",
  },
  {
    id: "crowbar",
    name: "Crowbar",
    detail: "Advantage on Strength checks where leverage applies.",
    weightLb: 5,
    costCp: 200,
    group: "tools",
    stow: "inside",
  },
  {
    id: "climbers-kit",
    name: "Climber's kit",
    detail: "Pitons, boot tips, gloves, and a harness.",
    weightLb: 12,
    costCp: 2500,
    group: "tools",
    stow: "inside",
  },
  {
    id: "backpack",
    name: "Backpack",
    detail: "Holds 30 lb. Strap a bedroll or rope to the outside.",
    weightLb: 5,
    costCp: 200,
    group: "containers",
    stow: "worn",
    capacityLb: 30,
  },
  {
    id: "sack",
    name: "Sack",
    detail: "Holds 30 lb.",
    weightLb: 0.5,
    costCp: 1,
    group: "containers",
    stow: "worn",
    capacityLb: 30,
  },
  {
    id: "basket",
    name: "Basket",
    detail: "Holds 40 lb.",
    weightLb: 2,
    costCp: 40,
    group: "containers",
    stow: "worn",
    capacityLb: 40,
  },
  {
    id: "chest",
    name: "Chest",
    detail: "Holds 300 lb. Best on a cart.",
    weightLb: 25,
    costCp: 500,
    group: "containers",
    stow: "worn",
    capacityLb: 300,
  },
  {
    id: "pouch",
    name: "Pouch",
    detail: "Holds 6 lb.",
    weightLb: 1,
    costCp: 50,
    group: "containers",
    stow: "worn",
    capacityLb: 6,
  },
  {
    id: "bit",
    name: "Bit and bridle",
    detail: "For a mount.",
    weightLb: 1,
    costCp: 200,
    group: "tack",
    stow: "worn",
  },
  {
    id: "saddle-riding",
    name: "Saddle, riding",
    detail: "Sits on the animal.",
    weightLb: 25,
    costCp: 1000,
    group: "tack",
    stow: "worn",
  },
  {
    id: "saddle-pack",
    name: "Saddle, pack",
    detail: "For a beast of burden.",
    weightLb: 15,
    costCp: 500,
    group: "tack",
    stow: "worn",
  },
  {
    id: "saddle-military",
    name: "Saddle, military",
    detail: "Advantage on checks to stay mounted.",
    weightLb: 30,
    costCp: 2000,
    group: "tack",
    stow: "worn",
  },
  {
    id: "saddlebags",
    name: "Saddlebags",
    detail: "The rules list the weight, not a separate capacity.",
    weightLb: 8,
    costCp: 400,
    group: "tack",
    stow: "worn",
  },
];

const DEFAULT_PACKED: Record<string, number> = {
  bedroll: 4,
  tent: 2,
  "mess-kit": 4,
  tinderbox: 1,
  torch: 10,
  lantern: 1,
  oil: 2,
  rope: 1,
  crowbar: 1,
  backpack: 4,
  chest: 1,
};

export function defaultGear(): GearItem[] {
  return GEAR_TEMPLATE.map((item) => {
    const quantity = DEFAULT_PACKED[item.id] ?? 1;
    return {
      ...item,
      quantity,
      packed: item.id in DEFAULT_PACKED,
    };
  });
}

export function defaultPeople(): Person[] {
  return [
    { id: "bram", name: "Bram", strength: 16, eating: true, hauling: true },
    { id: "nim", name: "Nim", strength: 10, eating: true, hauling: true },
    { id: "sable", name: "Sable", strength: 12, eating: true, hauling: true },
    { id: "orrin", name: "Orrin", strength: 14, eating: true, hauling: true },
  ];
}

export function defaultMounts(): MountLine[] {
  return MOUNT_ORDER.map((id) => ({
    id,
    quantity: id === "mule" ? 1 : 0,
    harnessed: id === "mule",
  }));
}

export function sampleTrip(): Trip {
  return {
    days: 14,
    hotWeather: false,
    foodPlan: "rations",
    rationsOwned: 0,
    pasture: false,
    people: defaultPeople(),
    mounts: defaultMounts(),
    vehicle: "cart",
    gear: defaultGear(),
    customGear: [],
    waterPack: "barrels",
    spell: "off",
    variantEncumbrance: false,
    includePurchases: false,
  };
}

export function gearById(): Map<string, Omit<GearItem, "quantity" | "packed">> {
  return new Map(GEAR_TEMPLATE.map((item) => [item.id, item]));
}
