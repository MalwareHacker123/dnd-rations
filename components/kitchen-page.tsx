"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { Download, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { REGIONS, REGION_ORDER, type RegionId } from "@/lib/customers";
import { formatCount, formatPercent } from "@/lib/format";
import {
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
import { DISHES, INGREDIENTS, dishesFor } from "@/lib/pantry";
import { getSaveSnapshot, getServerSaveSnapshot, serializeSheet, setSaveSnapshot, sheetFilename, subscribeSaves, upsertSave } from "@/lib/saves";
import { getServerTripSnapshot, getTripSnapshot, setTripSnapshot, subscribeTrip } from "@/lib/storage";

const selectClass =
  "h-11 w-full rounded-xl border border-input bg-card px-3 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40";

function parseBound(raw: string, min: number, max: number): number | null {
  if (raw.trim() === "") return null;
  const value = Number(raw);
  if (!Number.isFinite(value)) return null;
  return Math.min(max, Math.max(min, Math.floor(value)));
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
    <label className="block space-y-1.5">
      <span className="text-sm font-medium">{label}</span>
      {children}
      <span className="block text-xs leading-5 text-muted-foreground">{hint}</span>
    </label>
  );
}

export function KitchenPage() {
  const choices = useSyncExternalStore(subscribeKitchen, getKitchenSnapshot, getServerKitchenSnapshot);
  const trip = useSyncExternalStore(subscribeTrip, getTripSnapshot, getServerTripSnapshot);
  const saves = useSyncExternalStore(subscribeSaves, getSaveSnapshot, getServerSaveSnapshot);
  const math = useMemo(() => kitchenCount(choices), [choices]);
  const dishes = dishesFor(choices.ingredient);
  const dish = DISHES.find((item) => item.id === choices.dish) ?? dishes[0];
  const ingredient = INGREDIENTS.find((item) => item.id === choices.ingredient);
  const [draftName, setDraftName] = useState("");
  const [notice, setNotice] = useState("");

  function patch(partial: Partial<KitchenChoices>) {
    const next = { ...choices, ...partial };
    if (partial.ingredient && partial.ingredient !== choices.ingredient) {
      const menu = dishesFor(partial.ingredient);
      if (!menu.some((item) => item.id === next.dish)) next.dish = menu[0].id;
    }
    setKitchenSnapshot(next);
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
          Pick the food, the street, and the roll. The count tells you who sits down.
        </p>
      </header>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <form className="space-y-4 rounded-2xl bg-card p-4 ring-1 ring-foreground/10 sm:p-5" onSubmit={(event) => event.preventDefault()}>
          <Field label="Ingredient" hint="What is in the pot. The dish list follows this.">
            <select
              className={selectClass}
              aria-label="Ingredient"
              value={choices.ingredient}
              onChange={(event) => patch({ ingredient: event.target.value })}
            >
              {INGREDIENTS.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Dish" hint="Only plates that use this ingredient.">
            <select
              className={selectClass}
              aria-label="Dish"
              value={choices.dish}
              onChange={(event) => patch({ dish: event.target.value })}
            >
              {dishes.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Region" hint="The crowd outside the door.">
            <select
              className={selectClass}
              aria-label="Region"
              value={choices.region}
              onChange={(event) => patch({ region: event.target.value as RegionId })}
            >
              {REGION_ORDER.map((id) => (
                <option key={id} value={id}>
                  {REGIONS[id].name}
                </option>
              ))}
            </select>
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nearby restaurants" hint="How many other kitchens are open.">
              <Input
                className="h-11 tabular-nums"
                inputMode="numeric"
                aria-label="Nearby restaurants"
                value={choices.rivals}
                onChange={(event) => {
                  const rivals = parseBound(event.target.value, 0, 40);
                  if (rivals !== null) patch({ rivals });
                }}
              />
            </Field>
            <Field label="Reputation" hint="Type 0 if nobody knows you. Up to 20.">
              <Input
                className="h-11 tabular-nums"
                inputMode="numeric"
                aria-label="Reputation"
                value={choices.reputation}
                onChange={(event) => {
                  const reputation = parseBound(event.target.value, 0, 20);
                  if (reputation !== null) patch({ reputation });
                }}
              />
            </Field>
          </div>

          <Field label="Customer wealth" hint="From a poor street to a rich one.">
            <select
              className={selectClass}
              aria-label="Customer wealth"
              value={choices.wealth}
              onChange={(event) => patch({ wealth: event.target.value as WealthId })}
            >
              {WEALTH.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Conflict" hint="Optional. Leave this on nothing if the city is quiet.">
            <select
              className={selectClass}
              aria-label="Conflict"
              value={choices.conflict}
              onChange={(event) => patch({ conflict: event.target.value as ConflictId })}
            >
              {CONFLICTS.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Cooking or charisma roll" hint="Type the roll. A normal check sits around 10 to 15.">
              <Input
                className="h-11 tabular-nums"
                inputMode="numeric"
                aria-label="Cooking or charisma roll"
                value={choices.roll}
                onChange={(event) => {
                  const roll = parseBound(event.target.value, 0, 40);
                  if (roll !== null) patch({ roll });
                }}
              />
            </Field>
            <Field label="Seats" hint="How many people you can feed.">
              <Input
                className="h-11 tabular-nums"
                inputMode="numeric"
                aria-label="Seats"
                value={choices.seats}
                onChange={(event) => {
                  const seats = parseBound(event.target.value, 0, 100000);
                  if (seats !== null) patch({ seats });
                }}
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
                {math.headline}
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
                {dish.name} made with {ingredient?.name.toLowerCase()} in {REGIONS[choices.region].name}.
              </p>
              <p className="text-sm leading-6">{rollLine(choices.roll, choices.region)}</p>
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
