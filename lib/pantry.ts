import type { RegionId } from "@/lib/customers";

export type Course = "street" | "tavern" | "fine";

export type ApplianceId = "stove" | "countertop" | "fryer" | "oven" | "ice" | "larder";

export type Ingredient = {
  id: string;
  name: string;
};

export type Dish = {
  id: string;
  name: string;
  ingredients: string[];
  course: Course;
  appliance: ApplianceId;
};

export const INGREDIENTS: Ingredient[] = [
  { id: "wheat", name: "Wheat" },
  { id: "barley", name: "Barley" },
  { id: "oats", name: "Oats" },
  { id: "rice", name: "Rice" },
  { id: "beans", name: "Beans" },
  { id: "cheese", name: "Cheese" },
  { id: "milk", name: "Milk" },
  { id: "butter", name: "Butter" },
  { id: "eggs", name: "Eggs" },
  { id: "beef", name: "Beef" },
  { id: "pork", name: "Pork" },
  { id: "chicken", name: "Chicken" },
  { id: "mutton", name: "Mutton" },
  { id: "venison", name: "Venison" },
  { id: "sausage", name: "Sausage" },
  { id: "dried-meat", name: "Dried meat" },
  { id: "fish", name: "Fish" },
  { id: "shellfish", name: "Shellfish" },
  { id: "potatoes", name: "Potatoes" },
  { id: "onions", name: "Onions" },
  { id: "cabbage", name: "Cabbage" },
  { id: "mushrooms", name: "Mushrooms" },
  { id: "carrots", name: "Carrots" },
  { id: "turnips", name: "Turnips" },
  { id: "apples", name: "Apples" },
  { id: "berries", name: "Berries" },
  { id: "grapes", name: "Grapes" },
  { id: "honey", name: "Honey" },
  { id: "herbs", name: "Herbs" },
  { id: "salt", name: "Salt" },
  { id: "spices", name: "Spices" },
  { id: "ale", name: "Ale" },
  { id: "wine", name: "Wine" },
  { id: "hardtack", name: "Hardtack" },
];

export const DISHES: Dish[] = [
  { id: "day-loaf", name: "Day loaf", ingredients: ["wheat"], course: "street", appliance: "oven" },
  { id: "sunday-loaf", name: "Sunday loaf", ingredients: ["wheat"], course: "tavern", appliance: "oven" },
  { id: "barley-broth", name: "Barley broth", ingredients: ["barley"], course: "street", appliance: "stove" },
  { id: "oat-porridge", name: "Oat porridge", ingredients: ["oats"], course: "street", appliance: "stove" },
  { id: "rice-bowl", name: "Rice bowl", ingredients: ["rice"], course: "tavern", appliance: "stove" },
  { id: "bean-pot", name: "Bean pot", ingredients: ["beans"], course: "street", appliance: "stove" },
  { id: "toasted-cheese", name: "Toasted cheese", ingredients: ["cheese"], course: "tavern", appliance: "countertop" },
  { id: "cheese-board", name: "Cheese board", ingredients: ["cheese"], course: "fine", appliance: "ice" },
  { id: "milk-porridge", name: "Milk porridge", ingredients: ["milk"], course: "street", appliance: "stove" },
  { id: "butter-cakes", name: "Butter cakes", ingredients: ["butter"], course: "tavern", appliance: "oven" },
  { id: "fried-eggs", name: "Fried eggs", ingredients: ["eggs"], course: "street", appliance: "countertop" },
  { id: "baked-eggs", name: "Baked eggs", ingredients: ["eggs"], course: "tavern", appliance: "oven" },
  { id: "beef-stew", name: "Beef stew", ingredients: ["beef"], course: "tavern", appliance: "stove" },
  { id: "roast-beef", name: "Roast beef", ingredients: ["beef"], course: "fine", appliance: "oven" },
  { id: "roast-pork", name: "Roast pork", ingredients: ["pork"], course: "tavern", appliance: "oven" },
  { id: "pork-pie", name: "Pork pie", ingredients: ["pork"], course: "street", appliance: "oven" },
  { id: "roast-chicken", name: "Roast chicken", ingredients: ["chicken"], course: "tavern", appliance: "oven" },
  { id: "fried-chicken", name: "Fried chicken", ingredients: ["chicken"], course: "street", appliance: "fryer" },
  { id: "roast-mutton", name: "Roast mutton", ingredients: ["mutton"], course: "tavern", appliance: "oven" },
  { id: "venison-stew", name: "Venison stew", ingredients: ["venison"], course: "tavern", appliance: "stove" },
  { id: "sausage-roll", name: "Sausage roll", ingredients: ["sausage"], course: "street", appliance: "countertop" },
  { id: "ration-skillet", name: "Ration skillet", ingredients: ["dried-meat"], course: "street", appliance: "countertop" },
  { id: "fish-stew", name: "Fish stew", ingredients: ["fish"], course: "tavern", appliance: "stove" },
  { id: "fried-fish", name: "Fried fish", ingredients: ["fish"], course: "street", appliance: "fryer" },
  { id: "baked-fish", name: "Baked fish", ingredients: ["fish"], course: "fine", appliance: "oven" },
  { id: "shellfish-stew", name: "Shellfish stew", ingredients: ["shellfish"], course: "tavern", appliance: "stove" },
  { id: "fried-prawns", name: "Fried prawns", ingredients: ["shellfish"], course: "street", appliance: "fryer" },
  { id: "shellfish-platter", name: "Shellfish platter", ingredients: ["shellfish"], course: "fine", appliance: "ice" },
  { id: "potato-cakes", name: "Potato cakes", ingredients: ["potatoes"], course: "street", appliance: "countertop" },
  { id: "potato-soup", name: "Potato soup", ingredients: ["potatoes"], course: "tavern", appliance: "stove" },
  { id: "onion-soup", name: "Onion soup", ingredients: ["onions"], course: "tavern", appliance: "stove" },
  { id: "cabbage-pot", name: "Cabbage pot", ingredients: ["cabbage"], course: "street", appliance: "stove" },
  { id: "mushroom-soup", name: "Mushroom soup", ingredients: ["mushrooms"], course: "tavern", appliance: "stove" },
  { id: "carrot-pottage", name: "Carrot pottage", ingredients: ["carrots"], course: "street", appliance: "stove" },
  { id: "turnip-mash", name: "Turnip mash", ingredients: ["turnips"], course: "street", appliance: "stove" },
  { id: "apple-tart", name: "Apple tart", ingredients: ["apples"], course: "tavern", appliance: "oven" },
  { id: "berry-pie", name: "Berry pie", ingredients: ["berries"], course: "tavern", appliance: "oven" },
  { id: "grape-tart", name: "Grape tart", ingredients: ["grapes"], course: "fine", appliance: "oven" },
  { id: "honey-cakes", name: "Honey cakes", ingredients: ["honey"], course: "tavern", appliance: "oven" },
  { id: "herb-broth", name: "Herb broth", ingredients: ["herbs"], course: "tavern", appliance: "stove" },
  { id: "salt-fish", name: "Salt fish", ingredients: ["salt"], course: "street", appliance: "stove" },
  { id: "spiced-roast", name: "Spiced roast", ingredients: ["spices"], course: "fine", appliance: "oven" },
  { id: "ale-bread", name: "Ale bread", ingredients: ["ale"], course: "tavern", appliance: "oven" },
  { id: "wine-supper", name: "Wine supper", ingredients: ["wine"], course: "fine", appliance: "ice" },
  { id: "hardtack-supper", name: "Hardtack supper", ingredients: ["hardtack"], course: "street", appliance: "stove" },
  { id: "wine-bread", name: "Wine bread", ingredients: ["wheat", "wine"], course: "tavern", appliance: "oven" },
  { id: "ale-loaf", name: "Ale loaf", ingredients: ["wheat", "ale"], course: "tavern", appliance: "oven" },
  { id: "onion-loaf", name: "Onion loaf", ingredients: ["wheat", "onions"], course: "street", appliance: "oven" },
  { id: "cheese-onion-pie", name: "Cheese and onion pie", ingredients: ["wheat", "cheese", "onions"], course: "tavern", appliance: "oven" },
  { id: "berry-wheat-tart", name: "Berry wheat tart", ingredients: ["wheat", "berries"], course: "tavern", appliance: "oven" },
  { id: "fisherman-pie", name: "Fisherman's pie", ingredients: ["fish", "potatoes", "wheat"], course: "tavern", appliance: "oven" },
  { id: "herb-chicken", name: "Herb chicken", ingredients: ["chicken", "herbs"], course: "tavern", appliance: "oven" },
  { id: "venison-mushroom", name: "Venison and mushrooms", ingredients: ["venison", "mushrooms"], course: "fine", appliance: "oven" },
  { id: "spiced-prawns", name: "Spiced prawns", ingredients: ["shellfish", "spices"], course: "street", appliance: "fryer" },
  { id: "pork-and-beans", name: "Pork and beans", ingredients: ["pork", "beans"], course: "tavern", appliance: "stove" },
  { id: "mushroom-barley", name: "Mushroom barley", ingredients: ["mushrooms", "barley"], course: "tavern", appliance: "stove" },
  { id: "herbed-fish", name: "Herbed fish", ingredients: ["fish", "herbs"], course: "tavern", appliance: "stove" },
  { id: "beef-and-turnip", name: "Beef and turnip", ingredients: ["beef", "turnips"], course: "tavern", appliance: "stove" },
  { id: "spiced-rice", name: "Spiced rice", ingredients: ["rice", "spices"], course: "tavern", appliance: "stove" },
  { id: "sausage-cabbage", name: "Sausage and cabbage", ingredients: ["sausage", "cabbage"], course: "street", appliance: "stove" },
  { id: "salt-pork", name: "Salt pork", ingredients: ["pork", "salt"], course: "street", appliance: "stove" },
  { id: "wine-stew", name: "Wine stew", ingredients: ["beef", "wine"], course: "tavern", appliance: "stove" },
  { id: "cream-eggs", name: "Creamed eggs", ingredients: ["eggs", "milk", "butter"], course: "tavern", appliance: "stove" },
  { id: "honey-berries", name: "Honeyed berries", ingredients: ["honey", "berries"], course: "street", appliance: "countertop" },
  { id: "grape-cheese", name: "Grapes and cheese", ingredients: ["grapes", "cheese"], course: "fine", appliance: "ice" },
];

const TASTE: Record<RegionId, { favorite: string[]; exotic: string[]; taboo: string[] }> = {
  port: {
    favorite: ["fish", "shellfish", "salt"],
    exotic: ["spices", "rice", "wine"],
    taboo: [],
  },
  vin: {
    favorite: ["wine", "grapes", "cheese", "spices"],
    exotic: ["fish", "shellfish"],
    taboo: ["hardtack", "beans", "cabbage", "oats", "dried-meat", "turnips", "potatoes"],
  },
  pomodoro: {
    favorite: ["wheat", "cheese", "herbs", "pork", "wine"],
    exotic: ["rice", "spices"],
    taboo: ["hardtack"],
  },
  mi: {
    favorite: ["rice", "fish", "mushrooms", "herbs", "eggs"],
    exotic: ["cheese", "beef", "wine", "milk"],
    taboo: ["hardtack"],
  },
  scones: {
    favorite: ["wheat", "berries", "honey", "eggs", "cheese", "butter"],
    exotic: ["spices"],
    taboo: ["shellfish", "rice"],
  },
  pimiento: {
    favorite: ["spices", "beans", "pork", "chicken", "onions"],
    exotic: ["wine", "grapes"],
    taboo: ["hardtack"],
  },
  "fast-food": {
    favorite: ["sausage", "potatoes", "chicken", "cheese", "ale"],
    exotic: ["fish"],
    taboo: ["wine", "grapes", "spices"],
  },
};

export function dishesFor(ingredient: string): Dish[] {
  const matches = DISHES.filter((dish) => dish.ingredients.length === 1 && dish.ingredients[0] === ingredient);
  return matches.length > 0 ? matches : DISHES.filter((dish) => dish.ingredients.length === 1 && dish.ingredients[0] === "wheat");
}

export function dishesForIngredients(ingredients: readonly string[]): Dish[] {
  const allowed = new Set(ingredients);
  const matches = DISHES.filter((dish) => dish.ingredients.every((id) => allowed.has(id)));
  if (matches.length === 0) return dishesFor(ingredients[0] ?? "wheat");
  return [...matches].sort((a, b) => b.ingredients.length - a.ingredients.length || a.name.localeCompare(b.name));
}

export function tasteFor(region: RegionId, ingredient: string): "favorite" | "neutral" | "exotic" | "taboo" {
  const taste = TASTE[region];
  if (taste.taboo.includes(ingredient)) return "taboo";
  if (taste.favorite.includes(ingredient)) return "favorite";
  if (taste.exotic.includes(ingredient)) return "exotic";
  return "neutral";
}
