import { describe, expect, it } from "vitest";
import { dishesFor } from "@/lib/pantry";
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
    expect(dishesFor("wheat").every((dish) => dish.ingredient === "wheat")).toBe(true);
    const switched = sanitizeChoices({ ...exampleChoices(), ingredients: ["wheat"], dishes: ["shellfish-stew"] });
    expect(switched?.dishes).toEqual(["day-loaf"]);
  });

  it("lets wealth, the roll, rivals, the week, and a conflict each change the count", () => {
    const base = kitchenCount(exampleChoices());
    expect(kitchenCount({ ...exampleChoices(), wealths: ["poor"] }).bEff).not.toBe(base.bEff);
    expect(kitchenCount({ ...exampleChoices(), roll: 8 }).mRep).toBeLessThan(base.mRep);
    expect(kitchenCount({ ...exampleChoices(), rivals: 0 }).interest).toBeGreaterThan(base.interest);
    expect(kitchenCount({ ...exampleChoices(), week: "no" }).mWeekly).toBe(1);
    expect(kitchenCount({ ...exampleChoices(), week: "maybe" }).mWeekly).toBe(1.2);
    expect(kitchenCount({ ...exampleChoices(), conflicts: ["shakedown"] }).cr).toBeLessThan(base.cr);
    expect(kitchenCount({ ...exampleChoices(), reputation: 8 }).mRep).toBeGreaterThan(base.mRep);
  });

  it("keeps a rich kitchen out of Vin unless the dish is fine", () => {
    const tavern = toHouse({
      ...exampleChoices(),
      regions: ["vin"],
      ingredients: ["cheese"],
      dishes: ["toasted-cheese"],
      wealths: ["rich"],
    });
    expect(tavern.menuTier).toBe(3);
    expect(
      kitchenCount({
        ...exampleChoices(),
        regions: ["vin"],
        ingredients: ["cheese"],
        dishes: ["toasted-cheese"],
        wealths: ["rich"],
      }).priceNote,
    ).toMatch(/Exclusivity/);
    const fine = kitchenCount({
      ...exampleChoices(),
      regions: ["vin"],
      ingredients: ["cheese"],
      dishes: ["cheese-board"],
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
    const secondDish = kitchenCount({ ...exampleChoices(), dishes: ["shellfish-stew", "fried-prawns"] });
    expect(secondDish.fService).toBe(1.1);
    expect(secondDish.mPrice).toBe(1.13);
    expect(secondDish.interest).not.toBe(base.interest);
    const platter = kitchenCount({ ...exampleChoices(), dishes: ["shellfish-stew", "shellfish-platter"] });
    expect(platter.priceNote).toMatch(/Scam/);
    expect(platter.mPrice).toBe(0.53);
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
});
