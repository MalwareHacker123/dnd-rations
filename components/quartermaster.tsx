"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { Minus, Plus, Printer, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { LedgerPanel } from "@/components/ledger-panel";
import {
  FOOD_PLANS,
  GEAR_GROUPS,
  MOUNTS,
  SPELL_USES,
  VEHICLE_ORDER,
  VEHICLES,
  WATER_ORDER,
  WATER_PACKS,
  sampleTrip,
} from "@/lib/catalog";
import { formatCoins, formatLb, plural } from "@/lib/format";
import { calculate } from "@/lib/ledger";
import { getServerTripSnapshot, getTripSnapshot, setTripSnapshot, subscribeTrip } from "@/lib/storage";
import type { GearItem, MountId, Person, Trip, VehicleId } from "@/lib/types";
import { cn } from "cn";

function parseBound(raw: string, min: number, max: number): number | null {
  if (raw.trim() === "") return null;
  const value = Number(raw);
  if (!Number.isFinite(value)) return null;
  return Math.min(max, Math.max(min, Math.floor(value)));
}

function Section({
  title,
  blurb,
  children,
}: {
  title: string;
  blurb: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <h2 className="font-heading text-xl font-semibold tracking-tight">{title}</h2>
        <CardDescription>{blurb}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
    </Card>
  );
}

function Choice({
  pressed,
  title,
  detail,
  onClick,
}: {
  pressed: boolean;
  title: string;
  detail: string;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      variant={pressed ? "default" : "outline"}
      aria-pressed={pressed}
      className="h-auto items-start justify-start px-3 py-2 text-left whitespace-normal"
      onClick={onClick}
    >
      <span className="flex flex-col items-start gap-0.5">
        <span>{title}</span>
        <span
          className={cn(
            "text-xs font-normal",
            pressed ? "text-primary-foreground/80" : "text-muted-foreground",
          )}
        >
          {detail}
        </span>
      </span>
    </Button>
  );
}

function Qty({
  value,
  label,
  max = 99,
  onChange,
}: {
  value: number;
  label: string;
  max?: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="flex items-center gap-1">
      <Button
        type="button"
        size="icon-sm"
        variant="outline"
        aria-label={`Fewer ${label}`}
        disabled={value <= 0}
        onClick={() => onChange(Math.max(0, value - 1))}
      >
        <Minus />
      </Button>
      <Input
        aria-label={`How many ${label}`}
        inputMode="numeric"
        className="h-7 w-14 px-1 text-center tabular-nums"
        value={value}
        onChange={(event) => {
          const next = parseBound(event.target.value, 0, max);
          if (next !== null) onChange(next);
        }}
      />
      <Button
        type="button"
        size="icon-sm"
        variant="outline"
        aria-label={`More ${label}`}
        disabled={value >= max}
        onClick={() => onChange(Math.min(max, value + 1))}
      >
        <Plus />
      </Button>
    </div>
  );
}

function SwitchRow({
  id,
  label,
  detail,
  checked,
  onCheckedChange,
}: {
  id: string;
  label: string;
  detail: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-lg bg-muted/50 px-3 py-3">
      <div>
        <Label htmlFor={id}>{label}</Label>
        <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}

export function Quartermaster() {
  const trip = useSyncExternalStore(subscribeTrip, getTripSnapshot, getServerTripSnapshot);
  const [custom, setCustom] = useState({ name: "", weight: "", cost: "" });
  const [customError, setCustomError] = useState("");
  const ledger = useMemo(() => calculate(trip), [trip]);

  function patch(partial: Partial<Trip>) {
    setTripSnapshot({ ...trip, ...partial });
  }

  function updatePerson(id: string, partial: Partial<Person>) {
    setTripSnapshot({
      ...trip,
      people: trip.people.map((person) => (person.id === id ? { ...person, ...partial } : person)),
    });
  }

  function updateMount(id: MountId, partial: Partial<Trip["mounts"][number]>) {
    setTripSnapshot({
      ...trip,
      mounts: trip.mounts.map((line) => (line.id === id ? { ...line, ...partial } : line)),
    });
  }

  function updateGear(id: string, partial: Partial<GearItem>, customItem = false) {
    const key = customItem ? "customGear" : "gear";
    setTripSnapshot({
      ...trip,
      [key]: trip[key].map((item) => (item.id === id ? { ...item, ...partial } : item)),
    });
  }

  function addCustom() {
    const name = custom.name.trim();
    if (!name) {
      setCustomError("Name the item first.");
      return;
    }
    const weight = Number(custom.weight);
    const costGp = Number(custom.cost);
    setTripSnapshot({
      ...trip,
      customGear: [
        ...trip.customGear,
        {
          id: crypto.randomUUID(),
          name: name.slice(0, 60),
          detail: "Added on this sheet.",
          weightLb: Number.isFinite(weight) ? Math.max(0, weight) : 0,
          costCp: Number.isFinite(costGp) ? Math.max(0, Math.round(costGp * 100)) : 0,
          group: "custom",
          stow: "inside",
          quantity: 1,
          packed: true,
        },
      ],
    });
    setCustom({ name: "", weight: "", cost: "" });
    setCustomError("");
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-8 pb-24 sm:px-6 lg:pb-10">
      <header className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-xl">
          <p className="text-xs font-medium tracking-[0.18em] text-primary uppercase">Fifth edition</p>
          <h1 className="mt-2 font-heading text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
            Quartermaster
          </h1>
          <p className="mt-3 text-base leading-7 text-muted-foreground">
            Check who is coming, what they eat, and what goes in the packs. The ledger adds the
            weight, the coin, and whether the cart can hold it.
          </p>
        </div>
        <div className="no-print flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={() => setTripSnapshot(sampleTrip())}>
            <RotateCcw />
            Sample party
          </Button>
          <Button type="button" variant="outline" onClick={() => window.print()}>
            <Printer />
            Print
          </Button>
        </div>
      </header>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="no-print order-2 space-y-6 lg:order-1">
          <Section
            title="The road"
            blurb="A fortnight is already filled in. Change the days and the ledger follows."
          >
            <div className="grid gap-4 sm:grid-cols-[8rem_1fr]">
              <div className="space-y-2">
                <Label htmlFor="days">Days</Label>
                <Input
                  id="days"
                  inputMode="numeric"
                  className="tabular-nums"
                  value={trip.days}
                  onChange={(event) => {
                    const days = parseBound(event.target.value, 0, 365);
                    if (days !== null) patch({ days });
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="owned">Ration packs already owned</Label>
                <Input
                  id="owned"
                  inputMode="numeric"
                  className="tabular-nums"
                  value={trip.rationsOwned}
                  onChange={(event) => {
                    const rationsOwned = parseBound(event.target.value, 0, 9999);
                    if (rationsOwned !== null) patch({ rationsOwned });
                  }}
                />
              </div>
            </div>
            <SwitchRow
              id="hot"
              label="Hot weather"
              detail="Two gallons of water a person, instead of one."
              checked={trip.hotWeather}
              onCheckedChange={(hotWeather) => patch({ hotWeather })}
            />
            <div className="grid gap-2 sm:grid-cols-3">
              {FOOD_PLANS.map((plan) => (
                <Choice
                  key={plan.id}
                  pressed={trip.foodPlan === plan.id}
                  title={plan.title}
                  detail={plan.detail}
                  onClick={() => patch({ foodPlan: plan.id })}
                />
              ))}
            </div>
            <div className="grid gap-2 sm:grid-cols-3">
              {SPELL_USES.map((spell) => (
                <Choice
                  key={spell.id}
                  pressed={trip.spell === spell.id}
                  title={spell.title}
                  detail={spell.detail}
                  onClick={() => patch({ spell: spell.id })}
                />
              ))}
            </div>
            <SwitchRow
              id="variant"
              label="Variant encumbrance"
              detail="Speed drops once the party carries more than Strength × 5."
              checked={trip.variantEncumbrance}
              onCheckedChange={(variantEncumbrance) => patch({ variantEncumbrance })}
            />
          </Section>

          <Section
            title="Who is eating"
            blurb="Eats adds a mouth. Hauls adds Strength × 15 pounds of carrying capacity."
          >
            {trip.people.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Nobody is on the sheet. Add an adventurer to pack food for them.
              </p>
            )}
            <ul className="divide-y divide-border">
              {trip.people.map((person) => (
                <li key={person.id} className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id={`${person.id}-eat`}
                      checked={person.eating}
                      onCheckedChange={(eating) => updatePerson(person.id, { eating })}
                    />
                    <Label htmlFor={`${person.id}-eat`}>Eats</Label>
                  </div>
                  <Input
                    aria-label={`Name for ${person.name || "adventurer"}`}
                    value={person.name}
                    placeholder="Name"
                    className="sm:max-w-48"
                    onChange={(event) => updatePerson(person.id, { name: event.target.value.slice(0, 40) })}
                  />
                  <div className="flex items-center gap-2">
                    <Label htmlFor={`${person.id}-str`}>Str</Label>
                    <Input
                      id={`${person.id}-str`}
                      inputMode="numeric"
                      className="w-16 tabular-nums"
                      value={person.strength}
                      onChange={(event) => {
                        const strength = parseBound(event.target.value, 1, 30);
                        if (strength !== null) updatePerson(person.id, { strength });
                      }}
                    />
                    <span className="w-16 text-xs text-muted-foreground tabular-nums">
                      {person.hauling ? formatLb(Math.min(30, Math.max(1, person.strength)) * 15) : "—"}
                    </span>
                  </div>
                  <div className="flex flex-1 items-center justify-between gap-3 sm:justify-end">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id={`${person.id}-haul`}
                        checked={person.hauling}
                        onCheckedChange={(hauling) => updatePerson(person.id, { hauling })}
                      />
                      <Label htmlFor={`${person.id}-haul`}>Hauls</Label>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        patch({ people: trip.people.filter((entry) => entry.id !== person.id) })
                      }
                    >
                      Remove
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
            <Button
              type="button"
              variant="outline"
              disabled={trip.people.length >= 12}
              onClick={() =>
                patch({
                  people: [
                    ...trip.people,
                    {
                      id: crypto.randomUUID(),
                      name: "",
                      strength: 10,
                      eating: true,
                      hauling: true,
                    },
                  ],
                })
              }
            >
              <Plus />
              Add adventurer
            </Button>
          </Section>

          <Section
            title="Beasts and the cart"
            blurb="An animal in harness can pull five times what it could carry, and the vehicle's weight comes out of that."
          >
            <SwitchRow
              id="pasture"
              label="The animals can graze"
              detail="No feed packed. Feed is 10 lb and 5 cp an animal each day when this is off."
              checked={trip.pasture}
              onCheckedChange={(pasture) => patch({ pasture })}
            />
            <ul className="divide-y divide-border">
              {trip.mounts.map((line) => {
                const mount = MOUNTS[line.id];
                const coming = line.quantity > 0;
                return (
                  <li key={line.id} className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center">
                    <div className="flex min-w-0 flex-1 items-start gap-3">
                      <Checkbox
                        id={`${line.id}-coming`}
                        className="mt-0.5"
                        checked={coming}
                        onCheckedChange={(checked) =>
                          updateMount(line.id, {
                            quantity: checked ? Math.max(1, line.quantity) : 0,
                            harnessed: checked ? line.harnessed : false,
                          })
                        }
                      />
                      <div>
                        <Label htmlFor={`${line.id}-coming`}>{mount.name}</Label>
                        <p className="text-xs text-muted-foreground">
                          Carries {formatLb(mount.capacityLb)} · {mount.speed} · {formatCoins(mount.costCp)} to buy
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 sm:justify-end">
                      <Qty
                        value={line.quantity}
                        max={20}
                        label={mount.name}
                        onChange={(quantity) =>
                          updateMount(line.id, {
                            quantity,
                            harnessed: quantity > 0 ? line.harnessed : false,
                          })
                        }
                      />
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id={`${line.id}-harness`}
                          checked={line.harnessed && coming}
                          disabled={!coming}
                          onCheckedChange={(harnessed) => updateMount(line.id, { harnessed })}
                        />
                        <Label htmlFor={`${line.id}-harness`}>In harness</Label>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
              {VEHICLE_ORDER.map((id) => (
                <Choice
                  key={id}
                  pressed={trip.vehicle === id}
                  title={VEHICLES[id].name}
                  detail={
                    id === "none"
                      ? "Everyone walks."
                      : `${formatLb(VEHICLES[id].weightLb)} · ${formatCoins(VEHICLES[id].costCp)}`
                  }
                  onClick={() => patch({ vehicle: id as VehicleId })}
                />
              ))}
            </div>
            <SwitchRow
              id="purchases"
              label="Include purchase prices"
              detail="Adds the animals and the vehicle to the coin total. Supplies are always counted."
              checked={trip.includePurchases}
              onCheckedChange={(includePurchases) => patch({ includePurchases })}
            />
          </Section>

          <Section
            title="Water and gear"
            blurb="Check a row to pack it. Rations, water, and feed are figured above and added on their own."
          >
            <div>
              <h3 className="mb-2 font-medium">How the water is carried</h3>
              <div className="grid gap-2 sm:grid-cols-2">
                {WATER_ORDER.map((id) => {
                  const spec = WATER_PACKS[id];
                  return (
                    <Choice
                      key={id}
                      pressed={trip.waterPack === id}
                      title={spec.name}
                      detail={
                        id === "waterskins"
                          ? "Holds 4 pints. Weighs 5 lb full. Two can ride on a belt."
                          : `Holds ${plural(spec.holdGal, "gallon")}. Container ${formatLb(spec.containerLb)}, water extra.`
                      }
                      onClick={() => patch({ waterPack: id })}
                    />
                  );
                })}
              </div>
            </div>

            {GEAR_GROUPS.map((group) => (
              <div key={group.id}>
                <h3 className="font-medium">{group.title}</h3>
                <p className="mb-1 text-xs text-muted-foreground">{group.blurb}</p>
                <ul className="divide-y divide-border">
                  {trip.gear
                    .filter((item) => item.group === group.id)
                    .map((item) => (
                      <GearRow
                        key={item.id}
                        item={item}
                        onPacked={(packed) =>
                          updateGear(item.id, {
                            packed,
                            quantity: packed ? Math.max(1, item.quantity) : item.quantity,
                          })
                        }
                        onQuantity={(quantity) =>
                          updateGear(item.id, { quantity, packed: quantity > 0 })
                        }
                      />
                    ))}
                </ul>
              </div>
            ))}

            <div>
              <h3 className="font-medium">Anything else</h3>
              <p className="mb-2 text-xs text-muted-foreground">
                A crate, a relic, a sack of flour. Cost is in gold pieces, so 0.5 is 5 sp.
              </p>
              {trip.customGear.length === 0 && (
                <p className="mb-3 text-sm text-muted-foreground">No extra items yet.</p>
              )}
              <ul className="divide-y divide-border">
                {trip.customGear.map((item) => (
                  <GearRow
                    key={item.id}
                    item={item}
                    onPacked={(packed) => updateGear(item.id, { packed }, true)}
                    onQuantity={(quantity) =>
                      updateGear(item.id, { quantity, packed: quantity > 0 }, true)
                    }
                    onRemove={() =>
                      patch({ customGear: trip.customGear.filter((entry) => entry.id !== item.id) })
                    }
                  />
                ))}
              </ul>
              <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_6rem_6rem_auto] sm:items-end">
                <div className="space-y-1">
                  <Label htmlFor="custom-name">Name</Label>
                  <Input
                    id="custom-name"
                    value={custom.name}
                    placeholder="Crate of ale"
                    aria-invalid={customError ? true : undefined}
                    onChange={(event) => {
                      setCustom((current) => ({ ...current, name: event.target.value }));
                      if (customError) setCustomError("");
                    }}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="custom-weight">Pounds</Label>
                  <Input
                    id="custom-weight"
                    inputMode="decimal"
                    value={custom.weight}
                    placeholder="0"
                    onChange={(event) =>
                      setCustom((current) => ({ ...current, weight: event.target.value }))
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="custom-cost">Gold</Label>
                  <Input
                    id="custom-cost"
                    inputMode="decimal"
                    value={custom.cost}
                    placeholder="0"
                    onChange={(event) =>
                      setCustom((current) => ({ ...current, cost: event.target.value }))
                    }
                  />
                </div>
                <Button type="button" onClick={addCustom}>
                  <Plus />
                  Add
                </Button>
              </div>
              {customError && (
                <p role="alert" className="mt-2 text-sm text-destructive">
                  {customError}
                </p>
              )}
            </div>
          </Section>

          <details className="rounded-xl bg-card px-4 py-3 text-sm ring-1 ring-foreground/10">
            <summary className="cursor-pointer font-medium">How these numbers are figured</summary>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-muted-foreground">
              <li>A person needs one pound of food a day. Half a pound counts as half a day without food.</li>
              <li>Rations are sold as a 2 lb pack for 5 sp, called one day of rations.</li>
              <li>Water is one gallon a day, or two in hot weather. A gallon weighs 8 pounds.</li>
              <li>A waterskin holds 4 pints and is listed at 5 lb full. A barrel holds 40 gallons and weighs 70 lb empty.</li>
              <li>Feed is 10 lb and 5 cp per animal per day.</li>
              <li>Carrying capacity is Strength × 15 pounds.</li>
              <li>
                A donkey, mule, pony, horse, camel, mastiff, or elephant uses the carrying capacity in the mount
                list. In harness, it pulls five times that, including the cart, wagon, carriage, or sled.
              </li>
              <li>A backpack or sack holds 30 lb. A chest holds 300 lb. A bedroll or coil of rope can be strapped outside a backpack.</li>
            </ul>
          </details>
        </div>

        <div className="order-1 lg:order-2">
          <LedgerPanel trip={trip} ledger={ledger} />
        </div>
      </div>

      <a
        href="#ledger"
        className="no-print fixed inset-x-0 bottom-0 z-20 flex items-center justify-between border-t bg-card/95 px-4 py-3 backdrop-blur lg:hidden"
      >
        <span className="font-heading text-lg font-semibold tabular-nums">{formatLb(ledger.totals.weightLb)}</span>
        <span className="text-sm tabular-nums">{formatCoins(ledger.totals.costCp)}</span>
      </a>

      <footer className="mt-10 max-w-3xl space-y-2 text-xs leading-5 text-muted-foreground">
        <p>Quartermaster is compatible with fifth edition. The sheet stays in this browser.</p>
        <p>
          This work includes material taken from the System Reference Document 5.1 (“SRD 5.1”) by
          Wizards of the Coast LLC and available at{" "}
          <a className="underline" href="https://dnd.wizards.com/resources/systems-reference-document">
            https://dnd.wizards.com/resources/systems-reference-document
          </a>
          . The SRD 5.1 is licensed under the Creative Commons Attribution 4.0 International License
          available at{" "}
          <a className="underline" href="https://creativecommons.org/licenses/by/4.0/legalcode">
            https://creativecommons.org/licenses/by/4.0/legalcode
          </a>
          .
        </p>
      </footer>
    </main>
  );
}

function GearRow({
  item,
  onPacked,
  onQuantity,
  onRemove,
}: {
  item: GearItem;
  onPacked: (packed: boolean) => void;
  onQuantity: (quantity: number) => void;
  onRemove?: () => void;
}) {
  const lineWeight = item.weightLb * item.quantity;
  return (
    <li className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center">
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <Checkbox
          id={item.id}
          className="mt-0.5"
          checked={item.packed}
          onCheckedChange={(packed) => onPacked(packed)}
        />
        <div className="min-w-0">
          <Label htmlFor={item.id}>{item.name}</Label>
          <p className="text-xs text-muted-foreground">
            {item.detail ? `${item.detail} ` : ""}
            {formatLb(item.weightLb)} · {formatCoins(item.costCp)}
            {item.capacityLb ? ` · holds ${formatLb(item.capacityLb)}` : ""}
            {item.packed && item.quantity > 1 ? ` · line ${formatLb(lineWeight)}` : ""}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 sm:justify-end">
        <Qty value={item.quantity} label={item.name} onChange={onQuantity} />
        {onRemove && (
          <Button type="button" variant="ghost" size="sm" onClick={onRemove}>
            Remove
          </Button>
        )}
      </div>
    </li>
  );
}
