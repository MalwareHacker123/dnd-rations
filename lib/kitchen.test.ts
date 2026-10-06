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
    const switched = sanitizeChoices({ ...exampleChoices(), ingredient: "wheat", dish: "shellfish-stew" });
    expect(switched?.dish).toBe("day-loaf");
  });

  it("lets wealth, the roll, rivals, the week, and a conflict each change the count", () => {
    const base = kitchenCount(exampleChoices());
    expect(kitchenCount({ ...exampleChoices(), wealth: "poor" }).bEff).not.toBe(base.bEff);
    expect(kitchenCount({ ...exampleChoices(), roll: 8 }).mRep).toBeLessThan(base.mRep);
    expect(kitchenCount({ ...exampleChoices(), rivals: 0 }).interest).toBeGreaterThan(base.interest);
    expect(kitchenCount({ ...exampleChoices(), week: "no" }).mWeekly).toBe(1);
    expect(kitchenCount({ ...exampleChoices(), week: "maybe" }).mWeekly).toBe(1.2);
    expect(kitchenCount({ ...exampleChoices(), conflict: "shakedown" }).cr).toBeLessThan(base.cr);
    expect(kitchenCount({ ...exampleChoices(), reputation: 8 }).mRep).toBeGreaterThan(base.mRep);
  });

  it("keeps a rich kitchen out of Vin unless the dish is fine", () => {
    const tavern = toHouse({ ...exampleChoices(), region: "vin", ingredient: "cheese", dish: "toasted-cheese", wealth: "rich" });
    expect(tavern.menuTier).toBe(3);
    expect(kitchenCount({ ...exampleChoices(), region: "vin", ingredient: "cheese", dish: "toasted-cheese", wealth: "rich" }).priceNote).toMatch(/Exclusivity/);
    const fine = kitchenCount({ ...exampleChoices(), region: "vin", ingredient: "cheese", dish: "cheese-board", wealth: "rich", rivals: 0, week: "yes", roll: 16, reputation: 0 });
    expect(fine.priceNote).toBeNull();
  });
});
