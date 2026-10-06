import { describe, expect, it } from "vitest";
import {
  calculateHouse,
  cuisineMultiplier,
  exampleHouse,
  priceMultiplier,
  REGIONS,
  reputationMultiplier,
  sanitizeHouse,
} from "@/lib/customers";

describe("customer equation", () => {
  it("matches the Port District seafood bistro", () => {
    const math = calculateHouse(exampleHouse());
    expect(math.bEff).toBe(5320);
    expect(math.mCuisine).toBe(1.5);
    expect(math.mPrice).toBe(0.95);
    expect(math.mRep).toBe(1.3);
    expect(math.mWeekly).toBe(1.6);
    expect(math.weights).toEqual({ cuisine: 0.525, price: 0.285, rep: 0.26, weekly: 0.24 });
    expect(math.aFood).toBe(1.31);
    expect(math.lambda).toBe(0.15);
    expect(math.mSystem).toBe(1);
    expect(math.eMarket).toBe(0.6376);
    expect(math.interest).toBe(5821);
    expect(math.cr).toBe(0.5816);
    expect(math.attracted).toBe(3385);
    expect(math.served).toBe(300);
    expect(math.turnedAway).toBe(3085);
    expect(math.headline).toBe("Fully booked.");
  });

  it("uses the published foot-traffic table", () => {
    expect(REGIONS.vin.bEff).toBe(782);
    expect(REGIONS.mi.bEff).toBe(2300);
    expect(REGIONS.pomodoro.bEff).toBe(3119);
    expect(REGIONS.scones.bEff).toBe(1950);
    expect(REGIONS.pimiento.bEff).toBe(3989);
    expect(REGIONS.port.bEff).toBe(5320);
    expect(REGIONS["fast-food"].bEff).toBe(6293);
  });

  it("applies price exceptions before the gap formula", () => {
    expect(priceMultiplier("port", 4, 2).value).toBe(0.1);
    expect(priceMultiplier("port", 3, 2).value).toBe(0.95);
    expect(priceMultiplier("vin", 4, 6).value).toBe(0.05);
    expect(priceMultiplier("vin", 5, 6).value).toBe(0.95);
    expect(priceMultiplier("mi", 1, 6).value).toBe(roundGap(5));
  });

  it("drops Pomodoro reputation on a low check or a lingering slump", () => {
    expect(reputationMultiplier("pomodoro", 9, 0).value).toBe(0.2);
    expect(reputationMultiplier("pomodoro", 16, 3).value).toBe(0.2);
    expect(reputationMultiplier("pomodoro", 16, 0).value).toBe(1.3);
    expect(reputationMultiplier("port", 9, 0).value).toBe(0.95);
  });

  it("scores weekly trends with the synergy bonus", () => {
    const base = exampleHouse();
    expect(calculateHouse({ ...base, favoredIngredient: true, wantedDish: true }).mWeekly).toBe(1.6);
    expect(calculateHouse({ ...base, favoredIngredient: true, wantedDish: false }).mWeekly).toBe(1.2);
    expect(calculateHouse({ ...base, favoredIngredient: false, wantedDish: true }).mWeekly).toBe(1.25);
    expect(calculateHouse({ ...base, favoredIngredient: false, wantedDish: false }).mWeekly).toBe(1);
  });

  it("softens exotic food only in Mi Region", () => {
    expect(cuisineMultiplier("mi", "exotic")).toBe(0.85);
    expect(cuisineMultiplier("port", "exotic")).toBe(0.6);
    expect(cuisineMultiplier("scones", "taboo")).toBe(0.2);
  });

  it("uses the regional saturation constants and systemic multipliers", () => {
    expect(REGIONS.pomodoro.lambda).toBe(0.25);
    expect(REGIONS.mi.lambda).toBe(0.25);
    expect(REGIONS.scones.lambda).toBe(0.15);
    expect(REGIONS.vin.lambda).toBe(0.08);
    expect(REGIONS["fast-food"].lambda).toBe(0.08);

    const riot = calculateHouse({
      ...exampleHouse(),
      region: "fast-food",
      system: "riot",
      competitors: 0,
      districtTier: 1,
    });
    expect(riot.mSystem).toBe(0.4);
    expect(riot.eMarket).toBe(0.4);

    const unpaid = calculateHouse({
      ...exampleHouse(),
      region: "pimiento",
      system: "unaligned",
      competitors: 0,
      districtTier: 2,
    });
    expect(unpaid.mSystem).toBe(0.35);
    expect(unpaid.eMarket).toBe(0.35);
  });

  it("lets grab-and-go push conversion past one", () => {
    const math = calculateHouse({
      ...exampleHouse(),
      region: "fast-food",
      system: "hype",
      cuisine: "favorite",
      menuTier: 1,
      districtTier: 1,
      checkTotal: 30,
      favoredIngredient: true,
      wantedDish: true,
      competitors: 0,
      service: "grab",
      friction: "normal",
      capacity: 100000,
    });
    expect(math.cr).toBeGreaterThan(1);
    expect(math.served).toBe(math.attracted);
  });

  it("applies friction after the rounded sigmoid", () => {
    const math = calculateHouse({ ...exampleHouse(), friction: "unlicensed" });
    expect(math.sigmoid).toBe(0.5816);
    expect(math.cr).toBe(0.4071);
  });

  it("serves nobody when the house has no seats", () => {
    const math = calculateHouse({ ...exampleHouse(), capacity: 0 });
    expect(math.attracted).toBe(3385);
    expect(math.served).toBe(0);
    expect(math.turnedAway).toBe(3385);
    expect(math.headline).toBe("Nowhere to seat them.");
  });

  it("drops an illegal system when the region changes underneath a save", () => {
    const house = sanitizeHouse({ ...exampleHouse(), region: "port", system: "riot" });
    expect(house?.system).toBe("neutral");
    const paid = sanitizeHouse({ region: "pimiento", system: "cartel-paid", name: "Night stall" });
    expect(paid?.system).toBe("cartel-paid");
    expect(paid?.districtTier).toBe(2);
    expect(sanitizeHouse(null)).toBeNull();
  });
});

function roundGap(gap: number): number {
  return Math.round((1.3 - 0.35 * gap * gap) * 100) / 100;
}
