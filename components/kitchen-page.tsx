"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { ChevronDown, Download, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { REGIONS, REGION_ORDER, type RegionId } from "@/lib/customers";
import { formatCount, formatPercent } from "@/lib/format";
import {
  APPLIANCES,
  CONFLICTS,
  WEALTH,
  WEEKS,
  choicesFromHouse,
  kitchenCount,
  rollLine,
  toHouse,
  type ConflictId,
  type KitchenChoices,
  type WealthId,
  type WeekAnswer,
} from "@/lib/kitchen";
import { getKitchenSnapshot, getServerKitchenSnapshot, setKitchenSnapshot, subscribeKitchen } from "@/lib/kitchen-store";
import { DISHES, INGREDIENTS, dishesForIngredients, type ApplianceId } from "@/lib/pantry";
import { getSaveSnapshot, getServerSaveSnapshot, serializeSheet, setSaveSnapshot, sheetFilename, subscribeSaves, upsertSave } from "@/lib/saves";
import { getServerTripSnapshot, getTripSnapshot, setTripSnapshot, subscribeTrip } from "@/lib/storage";

const selectClass =
  "h-11 w-full rounded-xl border border-input bg-card px-3 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40";

function parseBound(raw: string, min: number, max: number): number | null {
  if (raw.trim() === "") return 0;
  const value = Number(raw);
  if (!Number.isFinite(value)) return null;
  return Math.min(max, Math.max(min, Math.floor(value)));
}

function NumberBox({
  label,
  value,
  max,
  onValue,
  emptyOnBlur = false,
}: {
  label: string;
  value: number;
  max: number;
  onValue: (next: number) => void;
  emptyOnBlur?: boolean;
}) {
  const [text, setText] = useState(value === 0 ? "" : String(value));
  const [seen, setSeen] = useState(value);
  if (value !== seen) {
    setSeen(value);
    setText(value === 0 ? "" : String(value));
  }

  return (
    <Input
      className="h-11 tabular-nums"
      type="text"
      inputMode="numeric"
      autoComplete="off"
      aria-label={label}
      value={text}
      onBlur={() => {
        if (emptyOnBlur && text === "") onValue(0);
      }}
      onChange={(event) => {
        const digits = event.target.value.replace(/\D/g, "");
        if (digits === "" || /^0+$/.test(digits)) {
          setText("");
          if (!emptyOnBlur) onValue(0);
          return;
        }
        const next = parseBound(digits, 0, max);
        if (next === null || next === 0) {
          setText("");
          if (!emptyOnBlur) onValue(0);
          return;
        }
        setText(String(next));
        onValue(next);
      }}
    />
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint: string;
  children: React.ReactNode;
}) {
  return (
    <div className="block space-y-1.5">
      <span className="text-sm font-medium">{label}</span>
      {children}
      <span className="block text-xs leading-5 text-muted-foreground">{hint}</span>
    </div>
  );
}

function choiceSummary(names: string[], emptyLabel: string): string {
  if (names.length === 0) return emptyLabel;
  if (names.length <= 2) return names.join(", ");
  return `${names[0]}, ${names[1]} +${names.length - 2}`;
}

function dishHint(menuSize: number, hasGear: boolean): string {
  if (!hasGear) return "Tick some equipment before anything can cook. Menu size is your choice, not the roll.";
  if (menuSize <= 0) return "Menu size is blank, so no dishes are on the board. The roll does not set this.";
  const plates = menuSize === 1 ? "1 dish" : `${menuSize} dishes`;
  return `The menu lists ${plates}. Change that number yourself. The cooking roll does not limit it.`;
}

function phrase(items: string[]): string {
  const shown = items.length > 4 ? [...items.slice(0, 3), `${items.length - 3} more`] : items;
  if (shown.length <= 1) return shown[0] ?? "";
  if (shown.length === 2) return `${shown[0]} and ${shown[1]}`;
  return `${shown.slice(0, -1).join(", ")}, and ${shown[shown.length - 1]}`;
}

function MultiPick<T extends string>({
  label,
  options,
  selected,
  onToggle,
  emptyLabel = "Choose at least one",
}: {
  label: string;
  options: { id: T; label: string; detail?: string; disabled?: boolean }[];
  selected: readonly T[];
  onToggle: (id: T, on: boolean) => void;
  emptyLabel?: string;
}) {
  const names = options.filter((option) => selected.includes(option.id)).map((option) => option.label);
  return (
    <details name="kitchen-picks" className="group">
      <summary
        aria-label={label}
        className={`${selectClass} flex cursor-pointer list-none items-center justify-between gap-3 [&::-webkit-details-marker]:hidden`}
      >
        <span className="truncate text-left">{choiceSummary(names, emptyLabel)}</span>
        <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" aria-hidden />
      </summary>
      <div className="mt-1 max-h-72 w-full overflow-auto rounded-xl border border-input bg-card p-1">
        {options.map((option) => (
          <label
            key={option.id}
            className={`flex min-h-11 items-start gap-3 rounded-lg px-2 py-2 ${option.disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer hover:bg-muted"}`}
            onClick={(event) => {
              if (option.disabled) event.preventDefault();
            }}
          >
            <Checkbox
              className="mt-0.5"
              aria-label={option.label}
              checked={selected.includes(option.id)}
              disabled={option.disabled}
              onCheckedChange={(value) => {
                if (option.disabled) return;
                onToggle(option.id, value === true);
              }}
            />
            <span className="min-w-0">
              <span className="block text-sm">{option.label}</span>
              {option.detail ? <span className="mt-0.5 block text-xs leading-5 text-muted-foreground">{option.detail}</span> : null}
            </span>
          </label>
        ))}
      </div>
    </details>
  );
}

export function KitchenPage() {
  const choices = useSyncExternalStore(subscribeKitchen, getKitchenSnapshot, getServerKitchenSnapshot);
  const trip = useSyncExternalStore(subscribeTrip, getTripSnapshot, getServerTripSnapshot);
  const saves = useSyncExternalStore(subscribeSaves, getSaveSnapshot, getServerSaveSnapshot);
  const math = useMemo(() => kitchenCount(choices), [choices]);
  const dishes = dishesForIngredients(choices.ingredients);
  const limit = choices.menuSize;
  const [draftName, setDraftName] = useState("");
  const [notice, setNotice] = useState("");
  const dishNames = choices.dishes
    .map((id) => DISHES.find((item) => item.id === id)?.name)
    .filter((name): name is string => Boolean(name));
  const ingredientNames = choices.ingredients
    .map((id) => INGREDIENTS.find((item) => item.id === id)?.name.toLowerCase())
    .filter((name): name is string => Boolean(name));
  const regionNames = choices.regions.map((id) => REGIONS[id].name);

  function patch(partial: Partial<KitchenChoices>) {
    setKitchenSnapshot({ ...choices, ...partial });
  }

  function toggleRequired<T extends string>(current: readonly T[], id: T, on: boolean): T[] | null {
    if (on) return current.includes(id) ? null : [...current, id];
    if (current.length <= 1) return null;
    return current.filter((item) => item !== id);
  }

  function onIngredients(id: string, on: boolean) {
    const ingredients = toggleRequired(choices.ingredients, id, on);
    if (!ingredients) return;
    const allowed = new Set(ingredients);
    let nextDishes = choices.dishes.filter((dishId) => {
      const dish = DISHES.find((item) => item.id === dishId);
      return dish ? dish.ingredients.every((item) => allowed.has(item)) : false;
    });
    if (nextDishes.length === 0) {
      const first = dishesForIngredients(ingredients).find((dish) => choices.appliances.includes(dish.appliance));
      nextDishes = first && choices.menuSize > 0 ? [first.id] : [];
    }
    setKitchenSnapshot({ ...choices, ingredients, dishes: nextDishes });
  }

  function onAppliances(id: ApplianceId, on: boolean) {
    const appliances = on
      ? choices.appliances.includes(id)
        ? choices.appliances
        : [...choices.appliances, id]
      : choices.appliances.filter((item) => item !== id);
    setKitchenSnapshot({ ...choices, appliances });
  }

  function onDishes(id: string, on: boolean) {
    const nextDishes = toggleRequired(choices.dishes, id, on);
    if (!nextDishes) return;
    setKitchenSnapshot({ ...choices, dishes: nextDishes });
  }

  function onRegions(id: RegionId, on: boolean) {
    const regions = toggleRequired(choices.regions, id, on);
    if (!regions) return;
    setKitchenSnapshot({ ...choices, regions });
  }

  function onWealth(id: WealthId, on: boolean) {
    const wealths = toggleRequired(choices.wealths, id, on);
    if (!wealths) return;
    setKitchenSnapshot({ ...choices, wealths });
  }

  function onConflict(id: ConflictId, on: boolean) {
    if (id === "none") {
      if (on) setKitchenSnapshot({ ...choices, conflicts: ["none"] });
      return;
    }
    if (on) {
      setKitchenSnapshot({
        ...choices,
        conflicts: [...choices.conflicts.filter((item) => item !== "none" && item !== id), id],
      });
      return;
    }
    const conflicts = choices.conflicts.filter((item) => item !== id);
    if (conflicts.length === 0) return;
    setKitchenSnapshot({ ...choices, conflicts });
  }

  function remember(name: string) {
    const house = toHouse({ ...choices, name });
    const existing = saves.find((entry) => entry.name === name);
    const sheet = {
      id: existing?.id ?? crypto.randomUUID(),
      name,
      savedAt: new Date().toISOString(),
      trip,
      house,
    };
    setSaveSnapshot(upsertSave(saves, sheet));
    setKitchenSnapshot(house.choices ? choicesFromHouse(house) : { ...choices, name });
    return sheet;
  }

  function onSave() {
    const name = (draftName.trim() || choices.name.trim() || "Tonight").slice(0, 60);
    remember(name);
    setDraftName(name);
    setNotice(`Saved “${name}” in this browser.`);
  }

  function onDownload() {
    const name = (draftName.trim() || choices.name.trim() || "Tonight").slice(0, 60);
    const sheet = remember(name);
    const blob = new Blob([serializeSheet(sheet)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = sheetFilename(name);
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    setDraftName(name);
    setNotice(`Downloaded ${sheetFilename(name)}.`);
  }

  function onOpen(id: string) {
    if (!id) return;
    const sheet = saves.find((entry) => entry.id === id);
    if (!sheet) return;
    setTripSnapshot(sheet.trip);
    setKitchenSnapshot(choicesFromHouse(sheet.house));
    setDraftName(sheet.name);
    setNotice(`Opened “${sheet.name}”.`);
  }

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 py-8 pb-24 sm:px-6">
      <header className="mb-6">
        <p className="text-xs font-medium tracking-[0.18em] text-primary uppercase">Service tonight</p>
        <h1 className="mt-2 font-heading text-4xl font-semibold tracking-tight sm:text-5xl">The Kitchen</h1>
        <p className="mt-3 max-w-xl text-base leading-7 text-muted-foreground">
          Tick what is in the kitchen, then the food. A dish such as wine bread needs wheat and wine. A longer menu brings more people.
        </p>
      </header>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <form className="space-y-4 rounded-2xl bg-card p-4 ring-1 ring-foreground/10 sm:p-5" onSubmit={(event) => event.preventDefault()}>
          <fieldset className="space-y-3" data-testid="kitchen-gear">
            <legend className="text-sm font-medium">What is in this kitchen?</legend>
            <p className="text-xs leading-5 text-muted-foreground">
              Tick every large piece you have. These boxes are the stove, the fryer, the oven, and the storage.
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {APPLIANCES.map((item) => {
                const on = choices.appliances.includes(item.id);
                return (
                  <label
                    key={item.id}
                    className={`flex min-h-11 cursor-pointer items-start gap-3 rounded-xl border px-3 py-2.5 ${on ? "border-primary bg-primary/5" : "border-input bg-card"}`}
                  >
                    <Checkbox
                      className="mt-0.5"
                      aria-label={item.label}
                      checked={on}
                      onCheckedChange={(value) => onAppliances(item.id, value === true)}
                    />
                    <span className="min-w-0">
                      <span className="block text-sm font-medium">{item.label}</span>
                      <span className="mt-0.5 block text-xs leading-5 text-muted-foreground">{item.detail}</span>
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          <Field label="Ingredients" hint="Tick everything in the pot. New dishes show up when you have every ingredient they use.">
            <MultiPick
              label="Ingredients"
              options={INGREDIENTS.map((item) => ({ id: item.id, label: item.name }))}
              selected={choices.ingredients}
              onToggle={onIngredients}
            />
          </Field>

          <Field label="Menu size" hint="How many dishes are on the menu. Blank counts as 0. The roll does not change this.">
            <NumberBox
              label="Menu size"
              value={choices.menuSize}
              max={40}
              emptyOnBlur
              onValue={(menuSize) => patch({ menuSize })}
            />
          </Field>

          <Field label="Dishes" hint={dishHint(choices.menuSize, choices.appliances.length > 0)}>
            <MultiPick
              label="Dishes"
              emptyLabel="Nothing on the fire"
              options={dishes.map((item) => {
                const appliance = APPLIANCES.find((gear) => gear.id === item.appliance);
                const owned = choices.appliances.includes(item.appliance);
                const selected = choices.dishes.includes(item.id);
                const full = !selected && choices.dishes.length >= limit;
                const recipe =
                  item.ingredients.length > 1
                    ? item.ingredients.map((id) => INGREDIENTS.find((food) => food.id === id)?.name ?? id).join(" + ")
                    : "";
                const lock = owned
                  ? full
                    ? `Menu size is ${limit === 1 ? "1 dish" : `${limit} dishes`}.`
                    : ""
                  : `Needs ${appliance ? appliance.label.toLowerCase() : "more equipment"}.`;
                const detail = [recipe, lock].filter(Boolean).join(". ");
                return {
                  id: item.id,
                  label: item.name,
                  detail: detail || undefined,
                  disabled: !selected && (!owned || full),
                };
              })}
              selected={choices.dishes}
              onToggle={onDishes}
            />
          </Field>

          <Field label="Regions" hint="Tick every crowd this kitchen is feeding.">
            <MultiPick
              label="Regions"
              options={REGION_ORDER.map((id) => ({ id, label: REGIONS[id].name }))}
              selected={choices.regions}
              onToggle={onRegions}
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nearby restaurants" hint="How many other kitchens are open. A blank box counts as 0.">
              <NumberBox
                label="Nearby restaurants"
                value={choices.rivals}
                max={40}
                onValue={(rivals) => patch({ rivals })}
              />
            </Field>
            <Field label="Reputation" hint="A blank box counts as 0. Up to 20.">
              <NumberBox
                label="Reputation"
                value={choices.reputation}
                max={20}
                onValue={(reputation) => patch({ reputation })}
              />
            </Field>
          </div>

          <Field label="Customer wealth" hint="Tick every kind of purse on the street, from poor to rich.">
            <MultiPick
              label="Customer wealth"
              options={WEALTH.map((item) => ({ id: item.id, label: item.label, detail: item.detail }))}
              selected={choices.wealths}
              onToggle={onWealth}
            />
          </Field>

          <Field label="Conflicts" hint="Optional. Nothing going on clears the other troubles.">
            <MultiPick
              label="Conflicts"
              options={CONFLICTS.map((item) => ({ id: item.id, label: item.label, detail: item.detail }))}
              selected={choices.conflicts}
              onToggle={onConflict}
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Cooking or charisma roll" hint="Type the roll. A normal check sits around 10 to 15. A blank box counts as 0.">
              <NumberBox
                label="Cooking or charisma roll"
                value={choices.roll}
                max={40}
                onValue={(roll) => patch({ roll })}
              />
            </Field>
            <Field label="Seats" hint="How many people you can feed. A blank box counts as 0.">
              <NumberBox
                label="Seats"
                value={choices.seats}
                max={100000}
                onValue={(seats) => patch({ seats })}
              />
            </Field>
          </div>

          <Field label="Dish of the week" hint="Yes if this region wants this food this week. Maybe if you are close. No if you missed it.">
            <select
              className={selectClass}
              aria-label="Dish of the week"
              value={choices.week}
              onChange={(event) => patch({ week: event.target.value as WeekAnswer })}
            >
              {WEEKS.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </Field>

          <div className="space-y-3 border-t pt-4">
            <p className="text-sm font-medium">Keep this kitchen</p>
            <p className="text-xs leading-5 text-muted-foreground">
              Save stores it in this browser. Download puts a file on your Chromebook.
            </p>
            <select
              className={selectClass}
              aria-label="Saved kitchens"
              value=""
              onChange={(event) => onOpen(event.target.value)}
            >
              <option value="">{saves.length === 0 ? "No saved kitchens yet" : "Open a saved kitchen"}</option>
              {saves.map((entry) => (
                <option key={entry.id} value={entry.id}>
                  {entry.name}
                </option>
              ))}
            </select>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                className="h-11"
                aria-label="Kitchen name"
                placeholder={choices.name || "Name this night"}
                value={draftName}
                maxLength={60}
                onChange={(event) => setDraftName(event.target.value)}
              />
              <Button type="button" className="h-11" onClick={onSave}>
                <Save />
                Save
              </Button>
              <Button type="button" variant="outline" className="h-11" onClick={onDownload}>
                <Download />
                Download
              </Button>
            </div>
            {notice && <p className="text-sm text-muted-foreground">{notice}</p>}
          </div>
        </form>

        <aside className="lg:sticky lg:top-6" aria-live="polite">
          <div className="overflow-hidden rounded-2xl bg-card ring-1 ring-foreground/10">
            <div className="bg-primary px-5 py-3 text-primary-foreground">
              <p className="text-xs tracking-[0.16em] uppercase">Tonight&apos;s ticket</p>
              <h2 className="mt-1 font-heading text-2xl font-semibold" data-testid="house-headline">
                {choices.dishes.length === 0 ? "Nothing is on the fire." : math.headline}
              </h2>
            </div>
            <div className="space-y-4 p-5">
              <div>
                <p className="font-heading text-5xl font-semibold tabular-nums" data-testid="house-served">
                  {formatCount(math.served)}
                </p>
                <p className="text-sm text-muted-foreground">paying customers</p>
              </div>
              <p className="text-sm leading-6">
                {choices.dishes.length === 0
                  ? "Nothing from the book is on the fire."
                  : `${phrase(dishNames)} made with ${phrase(ingredientNames)} in ${phrase(regionNames)}.`}
              </p>
              <p className="text-sm leading-6">{rollLine(choices.roll, choices.regions)}</p>
              <dl className="space-y-2 text-sm">
                <Row label="Interested" value={formatCount(math.interest)} testId="interested" />
                <Row label="Come to the door" value={formatCount(math.attracted)} testId="attracted" />
                <Row label="Turned away" value={formatCount(math.turnedAway)} testId="turned-away" />
                <Row label="Who actually pays" value={formatPercent(math.cr)} testId="conversion" />
              </dl>
              <p className="text-xs leading-5 text-muted-foreground">{math.detail}</p>
            </div>
          </div>
        </aside>
      </div>

      <a
        href="#top"
        className="no-print fixed inset-x-0 bottom-0 z-20 flex items-center justify-between border-t bg-card/95 px-4 py-3 backdrop-blur lg:hidden"
      >
        <span className="font-heading text-lg font-semibold tabular-nums">{formatCount(math.served)} served</span>
        <span className="text-sm tabular-nums">{formatPercent(math.cr)}</span>
      </a>
    </main>
  );
}

function Row({ label, value, testId }: { label: string; value: string; testId: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd data-testid={testId} className="font-medium tabular-nums">
        {value}
      </dd>
    </div>
  );
}
