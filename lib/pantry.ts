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
  ingredient: string;
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
  { id: "day-loaf", name: "Day loaf", ingredient: "wheat", course: "street", appliance: "oven" },
  { id: "sunday-loaf", name: "Sunday loaf", ingredient: "wheat", course: "tavern", appliance: "oven" },
  { id: "barley-broth", name: "Barley broth", ingredient: "barley", course: "street", appliance: "stove" },
  { id: "oat-porridge", name: "Oat porridge", ingredient: "oats", course: "street", appliance: "stove" },
  { id: "rice-bowl", name: "Rice bowl", ingredient: "rice", course: "tavern", appliance: "stove" },
  { id: "bean-pot", name: "Bean pot", ingredient: "beans", course: "street", appliance: "stove" },
  { id: "toasted-cheese", name: "Toasted cheese", ingredient: "cheese", course: "tavern", appliance: "countertop" },
  { id: "cheese-board", name: "Cheese board", ingredient: "cheese", course: "fine", appliance: "ice" },
  { id: "milk-porridge", name: "Milk porridge", ingredient: "milk", course: "street", appliance: "stove" },
  { id: "butter-cakes", name: "Butter cakes", ingredient: "butter", course: "tavern", appliance: "oven" },
  { id: "fried-eggs", name: "Fried eggs", ingredient: "eggs", course: "street", appliance: "countertop" },
  { id: "baked-eggs", name: "Baked eggs", ingredient: "eggs", course: "tavern", appliance: "oven" },
  { id: "beef-stew", name: "Beef stew", ingredient: "beef", course: "tavern", appliance: "stove" },
  { id: "roast-beef", name: "Roast beef", ingredient: "beef", course: "fine", appliance: "oven" },
  { id: "roast-pork", name: "Roast pork", ingredient: "pork", course: "tavern", appliance: "oven" },
  { id: "pork-pie", name: "Pork pie", ingredient: "pork", course: "street", appliance: "oven" },
  { id: "roast-chicken", name: "Roast chicken", ingredient: "chicken", course: "tavern", appliance: "oven" },
  { id: "fried-chicken", name: "Fried chicken", ingredient: "chicken", course: "street", appliance: "fryer" },
  { id: "roast-mutton", name: "Roast mutton", ingredient: "mutton", course: "tavern", appliance: "oven" },
  { id: "venison-stew", name: "Venison stew", ingredient: "venison", course: "tavern", appliance: "stove" },
  { id: "sausage-roll", name: "Sausage roll", ingredient: "sausage", course: "street", appliance: "countertop" },
  { id: "ration-skillet", name: "Ration skillet", ingredient: "dried-meat", course: "street", appliance: "countertop" },
  { id: "fish-stew", name: "Fish stew", ingredient: "fish", course: "tavern", appliance: "stove" },
  { id: "fried-fish", name: "Fried fish", ingredient: "fish", course: "street", appliance: "fryer" },
  { id: "baked-fish", name: "Baked fish", ingredient: "fish", course: "fine", appliance: "oven" },
  { id: "shellfish-stew", name: "Shellfish stew", ingredient: "shellfish", course: "tavern", appliance: "stove" },
  { id: "fried-prawns", name: "Fried prawns", ingredient: "shellfish", course: "street", appliance: "fryer" },
  { id: "shellfish-platter", name: "Shellfish platter", ingredient: "shellfish", course: "fine", appliance: "ice" },
  { id: "potato-cakes", name: "Potato cakes", ingredient: "potatoes", course: "street", appliance: "countertop" },
  { id: "potato-soup", name: "Potato soup", ingredient: "potatoes", course: "tavern", appliance: "stove" },
  { id: "onion-soup", name: "Onion soup", ingredient: "onions", course: "tavern", appliance: "stove" },
  { id: "cabbage-pot", name: "Cabbage pot", ingredient: "cabbage", course: "street", appliance: "stove" },
  { id: "mushroom-soup", name: "Mushroom soup", ingredient: "mushrooms", course: "tavern", appliance: "stove" },
  { id: "carrot-pottage", name: "Carrot pottage", ingredient: "carrots", course: "street", appliance: "stove" },
  { id: "turnip-mash", name: "Turnip mash", ingredient: "turnips", course: "street", appliance: "stove" },
  { id: "apple-tart", name: "Apple tart", ingredient: "apples", course: "tavern", appliance: "oven" },
  { id: "berry-pie", name: "Berry pie", ingredient: "berries", course: "tavern", appliance: "oven" },
  { id: "grape-tart", name: "Grape tart", ingredient: "grapes", course: "fine", appliance: "oven" },
  { id: "honey-cakes", name: "Honey cakes", ingredient: "honey", course: "tavern", appliance: "oven" },
  { id: "herb-broth", name: "Herb broth", ingredient: "herbs", course: "tavern", appliance: "stove" },
  { id: "salt-fish", name: "Salt fish", ingredient: "salt", course: "street", appliance: "stove" },
  { id: "spiced-roast", name: "Spiced roast", ingredient: "spices", course: "fine", appliance: "oven" },
  { id: "ale-bread", name: "Ale bread", ingredient: "ale", course: "tavern", appliance: "oven" },
  { id: "wine-supper", name: "Wine supper", ingredient: "wine", course: "fine", appliance: "ice" },
  { id: "hardtack-supper", name: "Hardtack supper", ingredient: "hardtack", course: "street", appliance: "stove" },
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
  const matches = DISHES.filter((dish) => dish.ingredient === ingredient);
  return matches.length > 0 ? matches : DISHES.filter((dish) => dish.ingredient === "wheat");
}

export function dishesForIngredients(ingredients: readonly string[]): Dish[] {
  const allowed = new Set(ingredients);
  const matches = DISHES.filter((dish) => allowed.has(dish.ingredient));
  return matches.length > 0 ? matches : dishesFor(ingredients[0] ?? "wheat");
}

export function tasteFor(region: RegionId, ingredient: string): "favorite" | "neutral" | "exotic" | "taboo" {
  const taste = TASTE[region];
  if (taste.taboo.includes(ingredient)) return "taboo";
  if (taste.favorite.includes(ingredient)) return "favorite";
  if (taste.exotic.includes(ingredient)) return "exotic";
  return "neutral";
}
