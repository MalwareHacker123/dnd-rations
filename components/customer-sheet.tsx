"use client";

import { useMemo } from "react";
import { useSyncExternalStore } from "react";
import { Dices } from "lucide-react";
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
        <span className={cn("text-xs font-normal", pressed ? "text-primary-foreground/80" : "text-muted-foreground")}>
          {detail}
        </span>
      </span>
    </Button>
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

          {(math.priceNote || math.repNote) && (
            <div className="space-y-2 text-sm">
              {math.priceNote && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-destructive">{math.priceNote}</p>}
              {math.repNote && <p className="rounded-lg bg-accent px-3 py-2">{math.repNote}</p>}
            </div>
          )}

          <div className="space-y-2 border-t pt-4 text-xs leading-5 text-muted-foreground">
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
          blurb="Cuisine, price, the cook’s name, and the week’s craving. The appeal is squared, so a strong house pulls far ahead of a dull one."
        >
          <div className="grid gap-2 sm:grid-cols-2">
            {CUISINES.map((cuisine) => (
              <Choice
                key={cuisine.id}
                pressed={house.cuisine === cuisine.id}
                title={cuisine.label}
                detail={
                  cuisine.id === "exotic" && house.region === "mi"
                    ? "Mi Region scores exotic food at 0.85."
                    : cuisine.detail
                }
                onClick={() => patch({ cuisine: cuisine.id as CuisineFit })}
              />
            ))}
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
            <div className="space-y-2 rounded-lg bg-muted/50 px-3 py-3">
              <Label htmlFor="slump">Slump days left</Label>
              <div className="flex flex-wrap items-center gap-2">
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
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => patch({ slumpDays: 1 + Math.floor(Math.random() * 6) })}
                >
                  <Dices />
                  Roll 1d6
                </Button>
              </div>
              <p className="text-xs leading-5 text-muted-foreground">
                In Pomodoro, a check under 10 drops reputation to 0.20 for 1d6 days.
              </p>
            </div>
          )}
          <div className="space-y-3">
            <Flag
              id="ingredient"
              label="Favored weekly ingredient"
              detail="The kitchen is using the ingredient people are craving."
              checked={house.favoredIngredient}
              onCheckedChange={(favoredIngredient) => patch({ favoredIngredient })}
            />
            <Flag
              id="dish"
              label="Wanted weekly dish"
              detail="The menu is serving the dish the district asked for."
              checked={house.wantedDish}
              onCheckedChange={(wantedDish) => patch({ wantedDish })}
            />
          </div>
        </Section>

        <Section
          title="The street"
          blurb="Competitors thin the crowd. Service and trouble decide how many of the interested people actually sit."
        >
          <div className="space-y-2">
            <Label htmlFor="competitors">Competing venues nearby</Label>
            <Input
              id="competitors"
              inputMode="numeric"
              className="tabular-nums sm:max-w-40"
              value={house.competitors}
              onChange={(event) => {
                const competitors = parseBound(event.target.value, 0, 40);
                if (competitors !== null) patch({ competitors });
              }}
            />
            <p className="text-xs text-muted-foreground">
              Saturation constant {formatFixed(region.lambda, 2)} for {region.name}.
            </p>
          </div>
          <div className="grid gap-2">
            {region.systems.map((option) => (
              <Choice
                key={option.id}
                pressed={house.system === option.id}
                title={`${option.label} · ${formatFixed(option.value, 2)}`}
                detail={option.detail}
                onClick={() => patch({ system: option.id as SystemId })}
              />
            ))}
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            {SERVICES.map((service) => (
              <Choice
                key={service.id}
                pressed={house.service === service.id}
                title={service.label}
                detail={`${formatFixed(service.value, 2)} · ${service.detail}`}
                onClick={() => patch({ service: service.id as ServiceStyle })}
              />
            ))}
          </div>
          <div className="grid gap-2">
            {FRICTIONS.map((friction) => (
              <Choice
                key={friction.id}
                pressed={house.friction === friction.id}
                title={friction.label}
                detail={`${formatFixed(friction.value, 2)} · ${friction.detail}`}
                onClick={() => patch({ friction: friction.id as FrictionId })}
              />
            ))}
          </div>
        </Section>
      </div>

      <div className="order-1 lg:order-2">
        <HousePanel house={house} math={math} />
      </div>
    </div>
  );
}

function Flag({
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
    <div className="flex items-start gap-3 rounded-lg bg-muted/50 px-3 py-3">
      <Checkbox id={id} className="mt-0.5" checked={checked} onCheckedChange={onCheckedChange} />
      <div>
        <Label htmlFor={id}>{label}</Label>
        <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
      </div>
    </div>
  );
}
