import { describe, expect, it } from "vitest";
import { exampleHouse } from "@/lib/customers";
import { sampleTrip } from "@/lib/catalog";
import { parseSheetText, serializeSheet, sheetFilename, upsertSave, type SavedSheet } from "@/lib/saves";

function sheet(name: string, id = name): SavedSheet {
  return {
    id,
    name,
    savedAt: "2026-10-06T12:00:00.000Z",
    trip: sampleTrip(),
    house: { ...exampleHouse(), name },
  };
}

describe("named sheets", () => {
  it("rejects a file that is not a quartermaster sheet", () => {
    expect(parseSheetText("{")).toBeNull();
    expect(parseSheetText(JSON.stringify({ trip: sampleTrip(), house: exampleHouse() }))).toBeNull();
    expect(parseSheetText(JSON.stringify({ kind: "quartermaster-sheet", version: 2 }))).toBeNull();
  });

  it("reads a downloaded sheet back into a trip and a house", () => {
    const original = sheet("Port bistro", "sheet-1");
    const parsed = parseSheetText(serializeSheet(original));
    expect(parsed?.id).toBe("sheet-1");
    expect(parsed?.name).toBe("Port bistro");
    expect(parsed?.house.region).toBe("port");
    expect(parsed?.house.capacity).toBe(300);
    expect(parsed?.trip.people).toHaveLength(4);
    expect(parsed?.trip.days).toBe(14);
  });

  it("replaces a sheet with the same name and keeps the newest first", () => {
    const first = upsertSave([], sheet("Morning", "a"));
    const second = upsertSave(first, sheet("Evening", "b"));
    const replaced = upsertSave(second, { ...sheet("Morning", "c"), house: { ...exampleHouse(), capacity: 12 } });
    expect(replaced.map((entry) => entry.name)).toEqual(["Morning", "Evening"]);
    expect(replaced[0]?.house.capacity).toBe(12);
    expect(replaced).toHaveLength(2);
  });

  it("keeps at most 24 named sheets", () => {
    let library: SavedSheet[] = [];
    for (let index = 0; index < 30; index += 1) {
      library = upsertSave(library, sheet(`House ${index}`, `id-${index}`));
    }
    expect(library).toHaveLength(24);
    expect(library[0]?.name).toBe("House 29");
    expect(library.some((entry) => entry.name === "House 0")).toBe(false);
  });

  it("names the download after the sheet", () => {
    expect(sheetFilename("Italian Seafood Bistro")).toBe("italian-seafood-bistro.json");
    expect(sheetFilename("   ")).toBe("quartermaster-sheet.json");
  });
});
