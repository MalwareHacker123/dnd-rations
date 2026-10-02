import { VEHICLES } from "@/lib/catalog";
import { formatCoins, formatLb, plural } from "@/lib/format";
import type { Ledger } from "@/lib/ledger";
import type { Problem, Trip } from "@/lib/types";
import { cn } from "cn";

function headline(ledger: Ledger): string {
  if (ledger.problems.includes("nowhere") || ledger.problems.includes("over")) {
    return "This is too heavy.";
  }
  if (ledger.problems.includes("too-weak") || ledger.problems.includes("unhitched")) {
    return "The vehicle is not ready.";
  }
  if (ledger.problems.includes("barrels")) return "The barrels need a carrier.";
  if (ledger.problems.includes("stow")) return "The food does not fit in the containers.";
  if (ledger.haul.status === "heavy") return "The party is heavily encumbered.";
  if (ledger.haul.status === "encumbered") return "The party can lift it, slowly.";
  if (ledger.totals.weightLb === 0) return "Nothing is packed yet.";
  if (ledger.haul.onWagon > 0 && ledger.haul.onParty === 0) return "The vehicle carries the load.";
  return "The load fits.";
}

function problemCopy(problem: Problem, ledger: Ledger, trip: Trip): string {
  const vehicle = VEHICLES[trip.vehicle].name;
  switch (problem) {
    case "over":
      return `The people still holding gear are over capacity by ${formatLb(ledger.haul.onParty - ledger.haul.partyMax)}.`;
    case "nowhere":
      return "Nothing here can carry this. Mark someone as hauling, or add a mount.";
    case "stow":
      return `The packs and chests are short by ${formatLb(ledger.totals.stowShortLb)}. A sack holds 30 lb, so that is ${plural(Math.ceil(ledger.totals.stowShortLb / 30), "more sack")}.`;
    case "unhitched":
      return `${vehicle} needs a creature marked in harness. A team pulls five times its carrying capacity, and the vehicle's own weight counts.`;
    case "too-weak":
      return `The team can pull ${formatLb(ledger.haul.pullLb)}. The ${vehicle.toLowerCase()} weighs ${formatLb(ledger.haul.vehicleLb)}.`;
    case "barrels":
      return "Some of the water is left on someone's back. Barrels belong on a beast or a cart.";
  }
}

function Meter({ value, max, bad }: { value: number; max: number; bad: boolean }) {
  const pct = max <= 0 ? (value > 0 ? 100 : 0) : Math.min(100, (value / max) * 100);
  return (
    <div
      className="h-2 overflow-hidden rounded-full bg-muted"
      role="meter"
      aria-valuemin={0}
      aria-valuemax={Math.max(0, Math.round(max))}
      aria-valuenow={Math.max(0, Math.round(value))}
    >
      <div
        className={cn("h-full rounded-full", bad ? "bg-destructive" : "bg-primary")}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function Row({
  label,
  weight,
  cost,
  strong = false,
}: {
  label: string;
  weight: number;
  cost: number;
  strong?: boolean;
}) {
  return (
    <tr className={cn(strong && "font-semibold")}>
      <th scope={strong ? "row" : undefined} className="py-1.5 text-left font-medium">
        {label}
      </th>
      <td className="py-1.5 text-right tabular-nums">{formatLb(weight)}</td>
      <td className="py-1.5 text-right tabular-nums">{formatCoins(cost)}</td>
    </tr>
  );
}

export function LedgerPanel({ trip, ledger }: { trip: Trip; ledger: Ledger }) {
  const trouble =
    ledger.problems.length > 0 ||
    ledger.haul.status === "heavy" ||
    ledger.haul.status === "encumbered";
  const notes: string[] = [];
  if (trip.hotWeather) {
    notes.push("Hot weather. Everyone needs two gallons a day.");
  }
  if (trip.foodPlan === "half") {
    notes.push(
      "Half rations count as half a day without food. After 3 + Constitution modifier days of that (minimum 1), exhaustion sets in.",
    );
  }
  if (trip.foodPlan === "minimum") {
    notes.push("One pound a day is enough. Each 2 lb ration pack covers two of those days.");
  }
  if (trip.spell === "party") {
    notes.push(
      "Create Food and Water spoils after a day, so this packs one backup day for up to 15 people. The animals are not fed by that casting.",
    );
  }
  if (trip.spell === "animals") {
    notes.push(
      "That casting feeds up to 5 steeds for a day. The people still carry their own rations and water.",
    );
  }
  if (trip.pasture && ledger.animalCount > 0) {
    notes.push("The animals are grazing, so no feed is packed. Turn that off in barren country.");
  }
  if (trip.variantEncumbrance) {
    notes.push(
      "Variant encumbrance: past Strength × 5, speed drops 10 feet. Past Strength × 10, speed drops 20 feet and Strength, Dexterity, and Constitution checks, attacks, and saves are at disadvantage.",
    );
  }

  const rationLine =
    ledger.food.packsNeeded === 0
      ? "No rations packed."
      : `Carry ${plural(ledger.food.packsNeeded, "ration pack")}. Buy ${plural(ledger.food.packsToBuy, "pack")}${
          trip.rationsOwned > 0 ? ` — ${plural(Math.max(0, Math.floor(trip.rationsOwned)), "pack")} already owned` : ""
        }.`;

  return (
    <aside id="ledger" className="scroll-mt-6 lg:sticky lg:top-6" aria-live="polite">
      <div className="overflow-hidden rounded-xl bg-card text-card-foreground shadow-sm ring-1 ring-foreground/10">
        <div className={cn("h-2", trouble ? "bg-destructive" : "bg-primary")} />
        <div className="space-y-5 p-5">
          <div>
            <p className="text-xs font-medium tracking-[0.16em] text-muted-foreground uppercase">
              Ledger
            </p>
            <h2 className="mt-1 font-heading text-2xl font-semibold tracking-tight" data-testid="ledger-headline">
              {headline(ledger)}
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-muted/70 px-3 py-3">
              <p className="text-xs text-muted-foreground">Weight</p>
              <p className="font-heading text-2xl font-semibold tabular-nums" data-testid="total-weight">
                {formatLb(ledger.totals.weightLb)}
              </p>
            </div>
            <div className="rounded-lg bg-muted/70 px-3 py-3">
              <p className="text-xs text-muted-foreground">To buy</p>
              <p className="font-heading text-2xl font-semibold tabular-nums" data-testid="total-cost">
                {formatCoins(ledger.totals.costCp)}
              </p>
            </div>
          </div>

          {ledger.problems.length > 0 && (
            <ul className="space-y-2 text-sm text-destructive">
              {ledger.problems.map((problem) => (
                <li key={problem}>{problemCopy(problem, ledger, trip)}</li>
              ))}
            </ul>
          )}

          <table className="w-full text-sm">
            <caption className="sr-only">Weight and cost of the packed supplies</caption>
            <thead>
              <tr className="text-xs text-muted-foreground">
                <th className="pb-1 text-left font-medium">Packed</th>
                <th className="pb-1 text-right font-medium">Weight</th>
                <th className="pb-1 text-right font-medium">Cost</th>
              </tr>
            </thead>
            <tbody>
              <Row label="Rations" weight={ledger.food.weightLb} cost={ledger.food.costCp} />
              <Row label="Water" weight={ledger.water.weightLb} cost={ledger.water.costCp} />
              <Row label="Feed" weight={ledger.feed.weightLb} cost={ledger.feed.costCp} />
              <Row label="Gear" weight={ledger.gear.weightLb} cost={ledger.gear.costCp} />
              {ledger.purchases.costCp > 0 && (
                <Row label="Animals and vehicle" weight={0} cost={ledger.purchases.costCp} />
              )}
              <Row label="Total" weight={ledger.totals.weightLb} cost={ledger.totals.costCp} strong />
            </tbody>
          </table>

          <div className="space-y-3 text-sm">
            <p>{rationLine}</p>
            <p>
              {ledger.water.gallons === 0
                ? "No water packed."
                : `${plural(ledger.water.gallons, "gallon")} in ${plural(ledger.water.count, ledger.water.singular)}. A gallon of water weighs 8 lb.`}
            </p>
            <p>
              {ledger.animalCount === 0
                ? "No animals are coming."
                : trip.pasture
                  ? `${plural(ledger.animalCount, "animal")} can graze.`
                  : `${plural(ledger.feed.feedDays, "day")} of feed for ${plural(ledger.animalCount, "animal")}. Feed is 10 lb and 5 cp a day.`}
            </p>
            {ledger.eaters > 0 && ledger.days > 0 && (
              <p className="text-muted-foreground">
                Each day: {formatLb(ledger.eaters * ledger.lbPerPersonDay)} of food and{" "}
                {plural(ledger.eaters * ledger.gallonsPerDay, "gallon")} of water
                {ledger.animalCount > 0 && !trip.pasture
                  ? `, plus ${formatLb(ledger.animalCount * 10)} of feed`
                  : ""}
                .
              </p>
            )}
          </div>

          <div className="space-y-3">
            <CarryLine
              label="On the vehicle"
              value={ledger.haul.onWagon}
              max={ledger.haul.wagonCargoLb}
              detail={
                trip.vehicle === "none"
                  ? "No vehicle selected."
                  : ledger.haul.wagonCargoLb === 0
                    ? "Nothing is hitched, so the cargo room is zero."
                    : `Pull ${formatLb(ledger.haul.pullLb)}, after the ${formatLb(ledger.haul.vehicleLb)} vehicle.`
              }
            />
            <CarryLine
              label="On mounts"
              value={ledger.haul.onMounts}
              max={ledger.haul.looseMountLb}
              detail={
                ledger.haul.looseMountLb === 0
                  ? "No beast is free to carry packs."
                  : "Carrying capacity of animals that are not in harness."
              }
            />
            <CarryLine
              label="On the party"
              value={ledger.haul.onParty}
              max={ledger.haul.partyMax}
              bad={ledger.haul.status === "over" || ledger.haul.status === "nowhere"}
              detail={
                ledger.haulers === 0
                  ? "Nobody is marked as hauling."
                  : trip.variantEncumbrance
                    ? `Capacity ${formatLb(ledger.haul.partyMax)}. Encumbered past ${formatLb(ledger.haul.partyEnc)}, heavily past ${formatLb(ledger.haul.partyHeavy)}.`
                    : `Carrying capacity is Strength × 15, ${formatLb(ledger.haul.partyMax)} in all.`
              }
            />
            <CarryLine
              label="Inside containers"
              value={Math.max(0, ledger.totals.stowNeedLb - Math.min(ledger.haul.onWagon, ledger.totals.stowNeedLb))}
              max={ledger.gear.capacityLb}
              bad={ledger.totals.stowShortLb > 0}
              detail={
                ledger.haul.onWagon > 0
                  ? "The cart or wagon bed holds what it is carrying. This is the rest, against packs, sacks, and chests."
                  : "Food, feed, and gear that is not strapped on, against packs, sacks, and chests."
              }
            />
          </div>

          {notes.length > 0 && (
            <ul className="space-y-2 text-sm text-muted-foreground">
              {notes.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </aside>
  );
}

function CarryLine({
  label,
  value,
  max,
  detail,
  bad = false,
}: {
  label: string;
  value: number;
  max: number;
  detail: string;
  bad?: boolean;
}) {
  const over = bad || (max > 0 && value > max) || (max === 0 && value > 0);
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <span className="font-medium">{label}</span>
        <span className={cn("tabular-nums", over && "text-destructive")}>
          {formatLb(value)}
          <span className="text-muted-foreground"> / {formatLb(max)}</span>
        </span>
      </div>
      <Meter value={value} max={max} bad={over} />
      <p className="text-xs text-muted-foreground">{detail}</p>
    </div>
  );
}
