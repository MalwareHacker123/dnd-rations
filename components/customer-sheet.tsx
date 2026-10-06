"use client";

import { useMemo } from "react";
import { useSyncExternalStore } from "react";
import { Dices, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  CUISINES,
  FRICTIONS,
  REGION_ORDER,
  REGIONS,
  SERVICES,
  calculateHouse,
  cuisineMultiplier,
  roundTo,
  type CuisineFit,
  type FrictionId,
  type House,
  type HouseMath,
  type RegionId,
  type ServiceStyle,
  type SystemId,
} from "@/lib/customers";
import { formatCount, formatFixed, formatPercent } from "@/lib/format";
import { getHouseSnapshot, getServerHouseSnapshot, setHouseSnapshot, subscribeHouse } from "@/lib/house-store";
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

function CheckRow({
  id,
  checked,
  label,
  detail,
  disabled = false,
  onCheckedChange,
}: {
  id: string;
  checked: boolean;
  label: string;
  detail: string;
  disabled?: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <div data-testid={`check-${id}`} className="flex items-start gap-3 rounded-lg bg-muted/50 px-3 py-3">
      <Checkbox
        id={id}
        className="mt-0.5"
        checked={checked}
        disabled={disabled}
        onCheckedChange={onCheckedChange}
      />
      <div className="min-w-0">
        <Label htmlFor={id} className="cursor-pointer">
          {label}
        </Label>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">{detail}</p>
      </div>
    </div>
  );
}

function TierPicker({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (tier: number) => void;
}) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">{label}</p>
      <div className="flex flex-wrap gap-2">
        {[1, 2, 3, 4, 5, 6].map((tier) => (
          <Button
            key={tier}
            type="button"
            size="sm"
            variant={value === tier ? "default" : "outline"}
            aria-pressed={value === tier}
            onClick={() => onChange(tier)}
          >
            Tier {tier}
          </Button>
        ))}
      </div>
    </div>
  );
}

function HousePanel({ house, math }: { house: House; math: HouseMath }) {
  const region = REGIONS[house.region];
  const quiet = math.attracted === 0 || (math.capacity === 0 && math.attracted > 0);
  const square = formatFixed(roundTo(math.aFood * math.aFood, 4), 4);

  return (
    <aside id="house" className="scroll-mt-6 lg:sticky lg:top-6" aria-live="polite" data-testid="house-panel">
      <div className="overflow-hidden rounded-xl bg-card text-card-foreground shadow-sm ring-1 ring-foreground/10">
        <div className={cn("h-2", quiet ? "bg-destructive" : "bg-primary")} />
        <div className="space-y-5 p-5">
          <div>
            <p className="text-xs font-medium tracking-[0.16em] text-primary uppercase">{region.name}</p>
            <h2 data-testid="house-headline" className="mt-2 font-heading text-3xl font-semibold tracking-tight">
              {math.headline}
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{math.detail}</p>
          </div>

          <div>
            <p data-testid="house-served" className="font-heading text-5xl font-semibold tabular-nums">
              {formatCount(math.served)}
            </p>
            <p className="text-sm text-muted-foreground">paying customers, of {formatCount(math.capacity)} seats</p>
          </div>

          <dl className="space-y-2 text-sm">
            <Stat label="Interested" value={formatCount(math.interest)} testId="interested" />
            <Stat label="Conversion" value={formatPercent(math.cr)} testId="conversion" />
            <Stat label="Tried to enter" value={formatCount(math.attracted)} testId="attracted" />
            <Stat label="Turned away" value={formatCount(math.turnedAway)} testId="turned-away" />
          </dl>

          <ul data-testid="factors" className="space-y-2 border-t pt-4 text-sm">
            {math.factors.map((factor) => (
              <li key={factor.id} className="flex items-start justify-between gap-3">
                <span className={cn("min-w-0", factor.on ? "text-foreground" : "text-muted-foreground")}>
                  <span className="mr-2 text-xs font-medium tracking-wide uppercase">
                    {factor.on ? "On" : "Off"}
                  </span>
                  {factor.label}
                </span>
                <span className="max-w-[11rem] text-right text-xs leading-5 text-muted-foreground">{factor.effect}</span>
              </li>
            ))}
          </ul>

          {(math.priceNote || math.repNote) && (
            <div className="space-y-2 text-sm">
              {math.priceNote && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-destructive">{math.priceNote}</p>}
              {math.repNote && <p className="rounded-lg bg-accent px-3 py-2">{math.repNote}</p>}
            </div>
          )}

          <details className="border-t pt-4 text-xs leading-5 text-muted-foreground">
            <summary className="cursor-pointer font-medium text-foreground">Baseline equation</summary>
            <div className="mt-3 space-y-2">
            <p>
              Foot traffic {formatCount(math.bRegion)} × wealth {formatFixed(math.wealth, 2)} ({region.wealthLabel}) gives{" "}
              {formatCount(math.bEff)} effective passers-by.
            </p>
            <p>
              Appeal {formatFixed(math.aFood, 2)} = {formatFixed(math.weights.cuisine, 3)} cuisine +{" "}
              {formatFixed(math.weights.price, 3)} price + {formatFixed(math.weights.rep, 3)} reputation +{" "}
              {formatFixed(math.weights.weekly, 3)} weekly.
            </p>
            <p>
              Market e^(−{formatFixed(math.lambda, 2)} × {math.competitors}) × {formatFixed(math.mSystem, 2)} ={" "}
              {formatFixed(math.eMarket, 4)}.
            </p>
            <p>
              Interested = floor({formatCount(math.bEff)} × {square} × {formatFixed(math.eMarket, 4)}) ={" "}
              {formatCount(math.interest)}.
            </p>
            <p>
              Conversion is {formatFixed(math.crMax, 2)} / (1 + {formatFixed(math.expTerm, 4)}) = {formatFixed(math.sigmoid, 4)},
              then × {formatFixed(math.fService, 2)} service × {formatFixed(math.fFriction, 2)} friction, which is{" "}
              {formatPercent(math.cr)}.
            </p>
            </div>
          </details>
        </div>
      </div>
    </aside>
  );
}

function Stat({ label, value, testId }: { label: string; value: string; testId: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd data-testid={testId} className="font-medium tabular-nums">
        {value}
      </dd>
    </div>
  );
}

export function CustomerBoard() {
  const house = useSyncExternalStore(subscribeHouse, getHouseSnapshot, getServerHouseSnapshot);
  const math = useMemo(() => calculateHouse(house), [house]);
  const region = REGIONS[house.region];

  function patch(partial: Partial<House>) {
    setHouseSnapshot({ ...house, ...partial });
  }

  function chooseRegion(next: RegionId) {
    const destination = REGIONS[next];
    const system = destination.systems.some((option) => option.id === house.system)
      ? house.system
      : destination.systems[0].id;
    setHouseSnapshot({
      ...house,
      region: next,
      districtTier: destination.districtTier,
      system,
    });
  }

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <div className="no-print order-2 space-y-6 lg:order-1">
        <Section title="The house" blurb="Name the restaurant and the district it is trying to feed.">
          <div className="space-y-2">
            <Label htmlFor="house-name">Restaurant</Label>
            <Input
              id="house-name"
              value={house.name}
              maxLength={80}
              onChange={(event) => patch({ name: event.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="region">Region</Label>
            <select
              id="region"
              data-testid="region"
              className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              value={house.region}
              onChange={(event) => chooseRegion(event.target.value as RegionId)}
            >
              {REGION_ORDER.map((id) => (
                <option key={id} value={id}>
                  {REGIONS[id].name}
                </option>
              ))}
            </select>
            <p className="text-xs leading-5 text-muted-foreground">
              {region.reality} Published foot traffic is {formatCount(region.bEff)}, from a base of{" "}
              {formatCount(region.base)} and wealth {formatFixed(region.wealth, 2)} ({region.wealthLabel}).
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="capacity">Seats</Label>
            <Input
              id="capacity"
              inputMode="numeric"
              className="tabular-nums sm:max-w-40"
              value={house.capacity}
              onChange={(event) => {
                const capacity = parseBound(event.target.value, 0, 100000);
                if (capacity !== null) patch({ capacity });
              }}
            />
          </div>
        </Section>

        <Section
          title="Food appeal"
          blurb="The baseline squares this index. Each box below is one term in it. Tick the one that matches this kitchen."
        >
          <div className="space-y-2">
            <Label htmlFor="cuisine-name">What is cooking</Label>
            <Input
              id="cuisine-name"
              value={house.cuisineName}
              maxLength={60}
              placeholder="Seafood"
              onChange={(event) => patch({ cuisineName: event.target.value })}
            />
          </div>
          <div className="grid gap-2">
            {CUISINES.map((cuisine) => {
              const score = cuisineMultiplier(house.region, cuisine.id);
              return (
                <CheckRow
                  key={cuisine.id}
                  id={`cuisine-${cuisine.id}`}
                  checked={house.cuisine === cuisine.id}
                  label={`${cuisine.label} · ${formatFixed(score, 2)}`}
                  detail={
                    cuisine.id === "exotic" && house.region === "mi"
                      ? "Mi Region scores exotic food at 0.85. One cuisine box stays checked."
                      : `${cuisine.detail} One cuisine box stays checked.`
                  }
                  onCheckedChange={(on) => {
                    if (on) patch({ cuisine: cuisine.id as CuisineFit });
                  }}
                />
              );
            })}
          </div>
          <TierPicker label="Menu tier" value={house.menuTier} onChange={(menuTier) => patch({ menuTier })} />
          <TierPicker
            label="District target tier"
            value={house.districtTier}
            onChange={(districtTier) => patch({ districtTier })}
          />
          <p className="text-xs leading-5 text-muted-foreground">
            Suggested target for {region.name} is tier {region.districtTier}. The worked example fixes Port District at
            tier 2. The other targets are starting points you can change.
          </p>
          <div className="grid gap-4 sm:grid-cols-[8rem_1fr] sm:items-end">
            <div className="space-y-2">
              <Label htmlFor="check">Check total</Label>
              <Input
                id="check"
                inputMode="numeric"
                className="tabular-nums"
                value={house.checkTotal}
                onChange={(event) => {
                  const checkTotal = parseBound(event.target.value, 0, 40);
                  if (checkTotal !== null) patch({ checkTotal });
                }}
              />
            </div>
            <p className="text-xs leading-5 text-muted-foreground">
              Wisdom with cook’s utensils, or Charisma with persuasion. Reputation is 0.50 plus the total divided by 20.
            </p>
          </div>
          {house.region === "pomodoro" && (
            <div className="space-y-3">
              <CheckRow
                id="slump-on"
                checked={house.checkTotal < 10 || house.slumpDays > 0}
                disabled={house.checkTotal < 10}
                label="Pomodoro slump · reputation 0.20"
                detail={
                  house.checkTotal < 10
                    ? "This check is under 10, so the slump box stays on. Roll 1d6 for the days."
                    : "Check this when a bad cook's name is still stuck on the house."
                }
                onCheckedChange={(on) => patch({ slumpDays: on ? Math.max(1, house.slumpDays) : 0 })}
              />
              <div className="flex flex-wrap items-end gap-2">
                <div className="space-y-2">
                  <Label htmlFor="slump">Slump days left</Label>
                  <Input
                    id="slump"
                    inputMode="numeric"
                    className="w-24 tabular-nums"
                    value={house.slumpDays}
                    onChange={(event) => {
                      const slumpDays = parseBound(event.target.value, 0, 6);
                      if (slumpDays !== null) patch({ slumpDays });
                    }}
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => patch({ slumpDays: 1 + Math.floor(Math.random() * 6) })}
                >
                  <Dices />
                  Roll 1d6
                </Button>
              </div>
            </div>
          )}
          <div className="space-y-3">
            <CheckRow
              id="ingredient"
              label={`${house.ingredientName.trim() || "Favored ingredient"} · +0.20`}
              detail="Checked when the kitchen is using the ingredient people want this week."
              checked={house.favoredIngredient}
              onCheckedChange={(favoredIngredient) => patch({ favoredIngredient })}
            />
            <div className="space-y-2">
              <Label htmlFor="ingredient-name">Ingredient</Label>
              <Input
                id="ingredient-name"
                value={house.ingredientName}
                maxLength={60}
                placeholder="Clams"
                onChange={(event) => patch({ ingredientName: event.target.value })}
              />
            </div>
            <CheckRow
              id="dish"
              label={`${house.dishName.trim() || "Wanted dish"} · +0.25`}
              detail="Checked when the menu is serving the dish the district asked for. Both boxes also add 0.15."
              checked={house.wantedDish}
              onCheckedChange={(wantedDish) => patch({ wantedDish })}
            />
            <div className="space-y-2">
              <Label htmlFor="dish-name">Dish</Label>
              <Input
                id="dish-name"
                value={house.dishName}
                maxLength={60}
                placeholder="Cioppino"
                onChange={(event) => patch({ dishName: event.target.value })}
              />
            </div>
          </div>
        </Section>

        <Section
          title="The street"
          blurb="Each open rival, each backer, and each kind of trouble is its own box. The baseline multiplies them into the count."
        >
          <div className="space-y-2">
            <p className="text-sm font-medium">Open rivals · {house.venues.filter((venue) => venue.open).length}</p>
            <p className="text-xs leading-5 text-muted-foreground">
              Only checked venues count. {region.name} uses saturation {formatFixed(region.lambda, 2)}.
            </p>
            <ul className="space-y-2">
              {house.venues.map((venue) => (
                <li key={venue.id} className="flex items-center gap-2">
                  <Checkbox
                    id={`venue-${venue.id}`}
                    checked={venue.open}
                    onCheckedChange={(open) =>
                      patch({
                        venues: house.venues.map((entry) =>
                          entry.id === venue.id ? { ...entry, open } : entry,
                        ),
                      })
                    }
                  />
                  <Label htmlFor={`venue-${venue.id}`} className="sr-only">
                    {venue.name || "Rival"} is open
                  </Label>
                  <Input
                    aria-label={`Name of rival ${venue.name || "venue"}`}
                    value={venue.name}
                    maxLength={60}
                    placeholder="Rival kitchen"
                    onChange={(event) =>
                      patch({
                        venues: house.venues.map((entry) =>
                          entry.id === venue.id ? { ...entry, name: event.target.value } : entry,
                        ),
                      })
                    }
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={`Remove ${venue.name || "rival"}`}
                    onClick={() => patch({ venues: house.venues.filter((entry) => entry.id !== venue.id) })}
                  >
                    <Trash2 />
                  </Button>
                </li>
              ))}
            </ul>
            <Button
              type="button"
              variant="outline"
              disabled={house.venues.length >= 12}
              onClick={() =>
                patch({
                  venues: [
                    ...house.venues,
                    { id: crypto.randomUUID(), name: "", open: true },
                  ],
                })
              }
            >
              <Plus />
              Add a rival
            </Button>
          </div>
          <div className="grid gap-2">
            {region.systems.map((option) => (
              <CheckRow
                key={option.id}
                id={`system-${option.id}`}
                checked={house.system === option.id}
                label={`${option.label} · ${formatFixed(option.value, 2)}`}
                detail={option.detail}
                onCheckedChange={(on) => {
                  if (on) patch({ system: option.id as SystemId });
                }}
              />
            ))}
          </div>
          <div className="grid gap-2">
            {SERVICES.map((service) => (
              <CheckRow
                key={service.id}
                id={`service-${service.id}`}
                checked={house.service === service.id}
                label={`${service.label} · ${formatFixed(service.value, 2)}`}
                detail={service.detail}
                onCheckedChange={(on) => {
                  if (on) patch({ service: service.id as ServiceStyle });
                }}
              />
            ))}
          </div>
          <div className="grid gap-2">
            {FRICTIONS.map((friction) => (
              <CheckRow
                key={friction.id}
                id={`friction-${friction.id}`}
                checked={house.friction === friction.id}
                label={`${friction.label} · ${formatFixed(friction.value, 2)}`}
                detail={friction.detail}
                onCheckedChange={(on) => {
                  if (on) patch({ friction: friction.id as FrictionId });
                }}
              />
            ))}
          </div>
        </Section>

        <details className="rounded-xl bg-card px-4 py-3 text-sm ring-1 ring-foreground/10">
          <summary className="cursor-pointer font-medium">Put this on a website</summary>
          <div className="mt-3 space-y-3 leading-6 text-muted-foreground">
            <p>This page is the site. Publish it, then send people the link. They tick the boxes and the count follows.</p>
            <ol className="list-decimal space-y-2 pl-5">
              <li>In this chat, click Publish. Copy the public link and send it.</li>
              <li>
                Or push the project to GitHub, open Settings, then Pages, and set Source to GitHub Actions. The address
                is https://your-name.github.io/your-repository/.
              </li>
            </ol>
            <p>What people type stays in their browser. A downloaded sheet is the copy they can pass around.</p>
          </div>
        </details>
      </div>

      <div className="order-1 lg:order-2">
        <HousePanel house={house} math={math} />
      </div>
    </div>
  );
}

