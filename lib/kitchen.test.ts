import { describe, expect, it } from "vitest";
import { dishesFor, dishesForIngredients } from "@/lib/pantry";
import { exampleChoices, kitchenCount, sanitizeChoices, toHouse } from "@/lib/kitchen";

describe("kitchen slip", () => {
  it("matches the port shellfish night when the boxes are filled that way", () => {
    const math = kitchenCount(exampleChoices());
    expect(math.bEff).toBe(5320);
    expect(math.mCuisine).toBe(1.5);
    expect(math.mPrice).toBe(0.95);
    expect(math.mRep).toBe(1.3);
    expect(math.mWeekly).toBe(1.6);
    expect(math.aFood).toBe(1.31);
    expect(math.interest).toBe(5821);
    expect(math.cr).toBe(0.5816);
    expect(math.attracted).toBe(3385);
    expect(math.served).toBe(300);
    expect(math.turnedAway).toBe(3085);
  });

  it("only offers dishes that use the chosen ingredient", () => {
    expect(dishesFor("shellfish").map((dish) => dish.name)).toEqual([
      "Shellfish stew",
      "Fried prawns",
      "Shellfish platter",
    ]);
    expect(dishesFor("wheat").every((dish) => dish.ingredients.length === 1 && dish.ingredients[0] === "wheat")).toBe(true);
    const switched = sanitizeChoices({ ...exampleChoices(), ingredients: ["wheat"], dishes: ["shellfish-stew"] });
    expect(switched?.dishes).toEqual([]);
    const baked = sanitizeChoices({
      ...exampleChoices(),
      ingredients: ["wheat"],
      dishes: ["day-loaf"],
      appliances: ["oven"],
    });
    expect(baked?.dishes).toEqual(["day-loaf"]);
  });

  it("lets wealth, the roll, rivals, the week, and a conflict each change the count", () => {
    const base = kitchenCount(exampleChoices());
    expect(kitchenCount({ ...exampleChoices(), wealths: ["poor"] }).bEff).not.toBe(base.bEff);
    expect(kitchenCount({ ...exampleChoices(), roll: 8 }).mRep).toBeLessThan(base.mRep);
    expect(kitchenCount({ ...exampleChoices(), rivals: 0 }).interest).toBeGreaterThan(base.interest);
    expect(kitchenCount({ ...exampleChoices(), week: "no" }).mWeekly).toBe(1);
    expect(kitchenCount({ ...exampleChoices(), week: "maybe" }).mWeekly).toBe(1.2);
    expect(kitchenCount({ ...exampleChoices(), conflicts: ["shakedown"] }).cr).toBeLessThan(base.cr);
  });

  it("lets a known name pull far more people to the door", () => {
    const base = kitchenCount(exampleChoices());
    const known = kitchenCount({ ...exampleChoices(), reputation: 8 });
    const legend = kitchenCount({ ...exampleChoices(), reputation: 20 });
    expect(known.mRep).toBe(base.mRep);
    expect(known.cr).toBe(base.cr);
    expect(known.interest).toBeGreaterThan(base.interest * 3);
    expect(known.attracted).toBeGreaterThan(base.attracted * 3);
    expect(known.served).toBe(300);
    expect(known.headline).toBe("The name packs the street.");
    expect(legend.interest).toBeGreaterThan(base.interest * 20);
    expect(legend.attracted).toBeGreaterThan(base.attracted * 20);
    expect(legend.served).toBe(300);
    const slumped = kitchenCount({
      ...exampleChoices(),
      regions: ["pomodoro"],
      roll: 8,
      reputation: 20,
    });
    const quiet = kitchenCount({ ...exampleChoices(), regions: ["pomodoro"], roll: 8, reputation: 0 });
    expect(slumped.interest).toBe(quiet.interest);
    expect(slumped.attracted).toBe(quiet.attracted);
  });

  it("keeps a rich kitchen out of Vin unless the dish is fine", () => {
    const tavern = toHouse({
      ...exampleChoices(),
      regions: ["vin"],
      ingredients: ["cheese"],
      dishes: ["toasted-cheese"],
      wealths: ["rich"],
      appliances: ["countertop"],
    });
    expect(tavern.menuTier).toBe(3);
    expect(
      kitchenCount({
        ...exampleChoices(),
        regions: ["vin"],
        ingredients: ["cheese"],
        dishes: ["toasted-cheese"],
        wealths: ["rich"],
        appliances: ["countertop"],
      }).priceNote,
    ).toMatch(/Exclusivity/);
    const fine = kitchenCount({
      ...exampleChoices(),
      regions: ["vin"],
      ingredients: ["cheese"],
      dishes: ["cheese-board"],
      appliances: ["ice"],
      wealths: ["rich"],
      rivals: 0,
      week: "yes",
      roll: 16,
      reputation: 0,
    });
    expect(fine.priceNote).toBeNull();
  });

  it("reads an older single choice as a list of one and keeps the worksheet", () => {
    const saved = sanitizeChoices({
      ingredient: "shellfish",
      dish: "shellfish-stew",
      region: "port",
      wealth: "modest",
      conflict: "none",
      rivals: 3,
      roll: 16,
      week: "yes",
      seats: 300,
      reputation: 0,
    });
    expect(saved?.ingredients).toEqual(["shellfish"]);
    expect(saved?.dishes).toEqual(["shellfish-stew"]);
    expect(saved?.regions).toEqual(["port"]);
    expect(kitchenCount(saved!).interest).toBe(5821);
    expect(kitchenCount(saved!).cr).toBe(0.5816);
    expect(kitchenCount(saved!).served).toBe(300);
  });

  it("changes the count when a second region or a second dish is ticked", () => {
    const base = kitchenCount(exampleChoices());
    const secondRegion = kitchenCount({ ...exampleChoices(), regions: ["port", "fast-food"] });
    expect(secondRegion.bEff).not.toBe(base.bEff);
    expect(secondRegion.interest).not.toBe(base.interest);
    const secondDish = kitchenCount({
      ...exampleChoices(),
      appliances: ["stove", "fryer"],
      dishes: ["shellfish-stew", "fried-prawns"],
    });
    expect(secondDish.interest).toBeGreaterThan(base.interest);
    expect(secondDish.attracted).toBeGreaterThan(base.attracted);
    const weakExtra = kitchenCount({
      ...exampleChoices(),
      ingredients: ["shellfish", "hardtack"],
      dishes: ["shellfish-stew", "hardtack-supper"],
    });
    expect(weakExtra.interest).toBeGreaterThan(base.interest);
    const platter = kitchenCount({
      ...exampleChoices(),
      appliances: ["ice"],
      dishes: ["shellfish-platter"],
    });
    expect(platter.priceNote).toMatch(/Scam/);
    expect(platter.mPrice).toBe(0.1);
  });

  it("multiplies two conflicts, and nothing going on does not sit beside another", () => {
    const shaken = kitchenCount({ ...exampleChoices(), conflicts: ["shakedown"] });
    const both = kitchenCount({ ...exampleChoices(), conflicts: ["shakedown", "riot"] });
    expect(both.mSystem).toBe(0.4);
    expect(both.fFriction).toBe(0.4);
    expect(both.interest).toBeLessThan(shaken.interest);
    const quiet = sanitizeChoices({ ...exampleChoices(), conflicts: ["none", "riot"] });
    expect(quiet?.conflicts).toEqual(["riot"]);
  });

  it("limits the book to the appliances on hand and the menu size you choose", () => {
    const stoveOnly = sanitizeChoices({
      ...exampleChoices(),
      appliances: ["stove"],
      dishes: ["shellfish-stew", "fried-prawns", "shellfish-platter"],
    });
    expect(stoveOnly?.dishes).toEqual(["shellfish-stew"]);
    const equipped = sanitizeChoices({
      ...exampleChoices(),
      appliances: ["stove", "fryer", "ice", "larder"],
      dishes: ["shellfish-stew", "fried-prawns", "shellfish-platter"],
    });
    expect(equipped?.dishes).toEqual(["shellfish-stew", "fried-prawns", "shellfish-platter"]);
    const crowded = sanitizeChoices({
      ...exampleChoices(),
      appliances: ["stove", "oven", "fryer", "ice", "larder", "countertop"],
      ingredients: ["shellfish", "wheat", "cheese"],
      dishes: ["shellfish-stew", "fried-prawns", "shellfish-platter", "day-loaf", "sunday-loaf", "cheese-board"],
      roll: 8,
      menuSize: 8,
    });
    expect(crowded?.dishes).toHaveLength(6);
    const sized = sanitizeChoices({ ...crowded, menuSize: 1 });
    expect(sized?.dishes).toEqual(["shellfish-stew"]);
    const dark = sanitizeChoices({ ...exampleChoices(), appliances: [] });
    expect(dark?.dishes).toEqual([]);
    expect(kitchenCount(dark!).served).toBe(0);
    expect(kitchenCount(dark!).interest).toBe(0);
    expect(kitchenCount(exampleChoices()).interest).toBe(5821);
  });

  it("adds a combined recipe when every ingredient is on hand, and more food brings more people", () => {
    expect(dishesForIngredients(["wheat"]).some((dish) => dish.id === "wine-bread")).toBe(false);
    const book = dishesForIngredients(["wheat", "wine"]);
    expect(book.some((dish) => dish.id === "wine-bread" && dish.ingredients.length === 2)).toBe(true);
    const base = kitchenCount(exampleChoices());
    const withWheat = kitchenCount({ ...exampleChoices(), ingredients: ["shellfish", "wheat"] });
    expect(withWheat.interest).toBeGreaterThan(base.interest);
    const wineBread = kitchenCount({
      ...exampleChoices(),
      ingredients: ["wheat", "wine"],
      dishes: ["wine-bread"],
      appliances: ["oven"],
    });
    expect(wineBread.interest).toBeGreaterThan(0);
    expect(wineBread.served).toBeGreaterThan(0);
  });
});
