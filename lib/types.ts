export type FoodPlan = "rations" | "minimum" | "half";

export type WaterPack = "waterskins" | "jugs" | "barrels" | "buckets";

export type SpellUse = "off" | "party" | "animals";

export type VehicleId = "none" | "cart" | "wagon" | "carriage" | "sled";

export type MountId =
  | "mule"
  | "pony"
  | "riding-horse"
  | "draft-horse"
  | "warhorse"
  | "camel"
  | "mastiff"
  | "elephant";

export type GearGroup = "camp" | "light" | "tools" | "containers" | "tack" | "custom";

export type Stow = "inside" | "strap" | "worn";

export type Person = {
  id: string;
  name: string;
  strength: number;
  eating: boolean;
  hauling: boolean;
};

export type MountLine = {
  id: MountId;
  quantity: number;
  harnessed: boolean;
};

export type GearItem = {
  id: string;
  name: string;
  detail: string;
  weightLb: number;
  costCp: number;
  group: GearGroup;
  stow: Stow;
  capacityLb?: number;
  quantity: number;
  packed: boolean;
};

export type Trip = {
  days: number;
  hotWeather: boolean;
  foodPlan: FoodPlan;
  rationsOwned: number;
  pasture: boolean;
  people: Person[];
  mounts: MountLine[];
  vehicle: VehicleId;
  gear: GearItem[];
  customGear: GearItem[];
  waterPack: WaterPack;
  spell: SpellUse;
  variantEncumbrance: boolean;
  includePurchases: boolean;
};

export type Problem = "over" | "nowhere" | "stow" | "unhitched" | "too-weak" | "barrels";

export type HaulStatus = "clear" | "encumbered" | "heavy" | "over" | "nowhere";
