import { describe, expect, it } from "vitest";
import { sampleTrip } from "@/lib/catalog";
import { formatCoins, formatLb } from "@/lib/format";
import { calculate } from "@/lib/ledger";
import { sanitizeTrip } from "@/lib/storage";
import type { Trip } from "@/lib/types";

function solo(): Trip {
  const trip = sampleTrip();
  trip.days = 1;
  trip.people = [{ id: "a", name: "A", strength: 10, eating: true, hauling: true }];
  trip.mounts = trip.mounts.map((line) => ({ ...line, quantity: 0, harnessed: false }));
  trip.vehicle = "none";
  trip.gear = trip.gear.map((item) => ({ ...item, packed: false }));
  trip.customGear = [];
  trip.waterPack = "waterskins";
  trip.pasture = true;
  trip.spell = "off";
  trip.hotWeather = false;
  trip.foodPlan = "rations";
  trip.rationsOwned = 0;
  trip.variantEncumbrance = false;
  trip.includePurchases = false;
  return trip;
}

describe("format", () => {
  it("prints coins without empty denominations", () => {
    expect(formatCoins(0)).toBe("0 cp");
    expect(formatCoins(100)).toBe("1 gp");
    expect(formatCoins(250)).toBe("2 gp, 5 sp");
    expect(formatCoins(101)).toBe("1 gp, 1 cp");
    expect(formatCoins(6330)).toBe("63 gp, 3 sp");
  });

  it("prints whole pounds without a decimal", () => {
    expect(formatLb(10)).toBe("10 lb");
    expect(formatLb(2.5)).toBe("2.5 lb");
  });
});

describe("calculate", () => {
  it("packs one ration and two waterskins for a single day", () => {
    const ledger = calculate(solo());
    expect(ledger.food).toMatchObject({ packsNeeded: 1, weightLb: 2, costCp: 50, packsToBuy: 1 });
    expect(ledger.water).toMatchObject({ gallons: 1, count: 2, weightLb: 10, costCp: 40, wornCount: 2 });
    expect(ledger.totals.weightLb).toBe(12);
    expect(ledger.totals.stowShortLb).toBe(2);
    expect(ledger.haul).toMatchObject({ partyMax: 150, onParty: 12, status: "clear" });
  });

  it("doubles water in hot weather and uses empty jug weight plus the water", () => {
    const trip = solo();
    trip.hotWeather = true;
    trip.waterPack = "jugs";
    const ledger = calculate(trip);
    expect(ledger.water).toMatchObject({ gallons: 2, count: 2, weightLb: 24, costCp: 4, stowedLb: 24 });
  });

  it("stretches ration packs on the minimum and on half rations", () => {
    const minimum = solo();
    minimum.days = 3;
    minimum.foodPlan = "minimum";
    expect(calculate(minimum).food).toMatchObject({ pounds: 3, packsNeeded: 2, weightLb: 4 });

    const half = solo();
    half.days = 1;
    half.people = [
      { id: "a", name: "A", strength: 10, eating: true, hauling: true },
      { id: "b", name: "B", strength: 10, eating: true, hauling: true },
      { id: "c", name: "C", strength: 10, eating: true, hauling: true },
    ];
    half.foodPlan = "half";
    expect(calculate(half).food).toMatchObject({ pounds: 1.5, packsNeeded: 1, weightLb: 2 });
  });

  it("buys only the ration packs the party does not already own", () => {
    const trip = solo();
    trip.days = 10;
    trip.rationsOwned = 4;
    const ledger = calculate(trip);
    expect(ledger.food).toMatchObject({ packsNeeded: 10, packsToBuy: 6, weightLb: 20, costCp: 300 });

    trip.rationsOwned = 12;
    expect(calculate(trip).food).toMatchObject({ packsToBuy: 0, weightLb: 20, costCp: 0 });
  });

  it("keeps one backup day when Create Food and Water feeds the party", () => {
    const trip = solo();
    trip.days = 10;
    trip.spell = "party";
    trip.people = Array.from({ length: 4 }, (_, index) => ({
      id: String(index),
      name: "A",
      strength: 10,
      eating: true,
      hauling: true,
    }));
    expect(calculate(trip).food).toMatchObject({ packsNeeded: 4, weightLb: 8 });

    trip.people = Array.from({ length: 16 }, (_, index) => ({
      id: String(index),
      name: "A",
      strength: 10,
      eating: true,
      hauling: true,
    }));
    expect(calculate(trip).food.pounds).toBe(15 * 2 + 10 * 2);
  });

  it("feeds animals unless they graze, and a spell covers only five of them", () => {
    const trip = solo();
    trip.days = 10;
    trip.pasture = false;
    trip.mounts = trip.mounts.map((line) =>
      line.id === "mule" ? { ...line, quantity: 7, harnessed: false } : line,
    );
    expect(calculate(trip).feed).toMatchObject({ feedDays: 70, weightLb: 700, costCp: 350 });

    trip.spell = "animals";
    expect(calculate(trip).feed).toMatchObject({
      coveredBySpell: 5,
      feedDays: 5 + 20,
      weightLb: 250,
    });

    trip.pasture = true;
    expect(calculate(trip).feed.weightLb).toBe(0);
  });

  it("gives a hitched team five times its capacity, minus the vehicle", () => {
    const trip = solo();
    trip.mounts = trip.mounts.map((line) =>
      line.id === "draft-horse" ? { ...line, quantity: 1, harnessed: true } : line,
    );
    trip.vehicle = "cart";
    const ledger = calculate(trip);
    expect(ledger.haul.pullLb).toBe(540 * 5);
    expect(ledger.haul.wagonCargoLb).toBe(2700 - 200);
    expect(ledger.haul.onParty).toBe(0);
  });

  it("treats harness as ordinary carrying when there is no vehicle", () => {
    const trip = solo();
    trip.mounts = trip.mounts.map((line) =>
      line.id === "mule" ? { ...line, quantity: 1, harnessed: true } : line,
    );
    const ledger = calculate(trip);
    expect(ledger.haul.looseMountLb).toBe(420);
    expect(ledger.haul.wagonCargoLb).toBe(0);
    expect(ledger.problems).not.toContain("unhitched");
  });

  it("warns when a vehicle has nobody in harness", () => {
    const trip = solo();
    trip.vehicle = "cart";
    expect(calculate(trip).problems).toContain("unhitched");
  });

  it("applies variant encumbrance only above the thresholds", () => {
    const trip = solo();
    trip.days = 0;
    trip.variantEncumbrance = true;
    const setWeight = (weightLb: number) => {
      trip.customGear = [
        {
          id: "load",
          name: "Load",
          detail: "",
          weightLb,
          costCp: 0,
          group: "custom",
          stow: "worn",
          quantity: 1,
          packed: true,
        },
      ];
    };
    setWeight(50);
    expect(calculate(trip).haul.status).toBe("clear");
    setWeight(51);
    expect(calculate(trip).haul.status).toBe("encumbered");
    setWeight(100);
    expect(calculate(trip).haul.status).toBe("encumbered");
    setWeight(101);
    expect(calculate(trip).haul.status).toBe("heavy");
    setWeight(150);
    expect(calculate(trip).haul.status).toBe("heavy");
    trip.variantEncumbrance = false;
    setWeight(150);
    expect(calculate(trip).haul.status).toBe("clear");
    setWeight(151);
    expect(calculate(trip).haul.status).toBe("over");
  });

  it("does not ask a backpack to hold gear the cart already carries", () => {
    const trip = solo();
    trip.days = 7;
    trip.vehicle = "cart";
    trip.mounts = trip.mounts.map((line) =>
      line.id === "mule" ? { ...line, quantity: 1, harnessed: true } : line,
    );
    const ledger = calculate(trip);
    expect(ledger.haul.onWagon).toBe(ledger.totals.weightLb);
    expect(ledger.totals.stowShortLb).toBe(0);
    expect(ledger.gear.capacityLb).toBe(0);
  });

  it("asks for sacks when the party carries the food themselves", () => {
    const trip = solo();
    trip.days = 7;
    const ledger = calculate(trip);
    expect(ledger.food.weightLb).toBe(14);
    expect(ledger.totals.stowShortLb).toBeGreaterThan(0);
    expect(ledger.problems).toContain("stow");
  });

  it("totals the sample fortnight on a mule cart", () => {
    const ledger = calculate(sampleTrip());
    expect(ledger.food).toMatchObject({ packsNeeded: 56, weightLb: 112, costCp: 2800 });
    expect(ledger.water).toMatchObject({ gallons: 56, count: 2, weightLb: 588, costCp: 400 });
    expect(ledger.feed).toMatchObject({ feedDays: 14, weightLb: 140, costCp: 70 });
    expect(ledger.gear.weightLb).toBe(147);
    expect(ledger.gear.capacityLb).toBe(420);
    expect(ledger.totals).toMatchObject({ weightLb: 987, costCp: 6330, stowShortLb: 0 });
    expect(ledger.haul).toMatchObject({
      wagonCargoLb: 2100 - 200,
      onWagon: 987,
      onParty: 0,
      status: "clear",
    });
    expect(formatCoins(ledger.totals.costCp)).toBe("63 gp, 3 sp");
  });

  it("adds animal and vehicle prices only when asked", () => {
    const trip = sampleTrip();
    trip.includePurchases = true;
    expect(calculate(trip).totals.costCp).toBe(6330 + 800 + 1500);
  });
});

describe("sanitizeTrip", () => {
  it("rejects junk and keeps catalog weights when a saved sheet is merged", () => {
    expect(sanitizeTrip(null)).toBeNull();
    const trip = sanitizeTrip({
      days: 3,
      foodPlan: "half",
      gear: [{ id: "torch", quantity: 4, packed: true, weightLb: 999 }],
      people: [{ id: "x", name: "Vesper", strength: 8, eating: false, hauling: true }],
    });
    expect(trip?.days).toBe(3);
    expect(trip?.foodPlan).toBe("half");
    expect(trip?.people).toEqual([
      { id: "x", name: "Vesper", strength: 8, eating: false, hauling: true },
    ]);
    expect(trip?.gear.find((item) => item.id === "torch")).toMatchObject({
      weightLb: 1,
      quantity: 4,
      packed: true,
    });
  });
});
