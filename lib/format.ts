export function formatNumber(value: number): string {
  const rounded = Math.round(value * 10) / 10;
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 1,
  }).format(rounded);
}

export function formatLb(value: number): string {
  return `${formatNumber(value)}\u00a0lb`;
}

export function formatCoins(copper: number): string {
  const sign = copper < 0 ? "−" : "";
  let remaining = Math.abs(Math.round(copper));
  const gold = Math.floor(remaining / 100);
  remaining %= 100;
  const silver = Math.floor(remaining / 10);
  const coins = remaining % 10;
  const parts: string[] = [];
  if (gold) parts.push(`${gold} gp`);
  if (silver) parts.push(`${silver} sp`);
  if (coins || parts.length === 0) parts.push(`${coins} cp`);
  return sign + parts.join(", ");
}

export function plural(count: number, singular: string, pluralForm?: string): string {
  const word = count === 1 ? singular : (pluralForm ?? `${singular}s`);
  return `${formatNumber(count)} ${word}`;
}

export function formatCount(value: number): string {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(Math.round(value));
}

export function formatFixed(value: number, digits: number): string {
  const scale = 10 ** digits;
  return (Math.round(value * scale) / scale).toFixed(digits);
}

export function formatPercent(value: number): string {
  return `${formatFixed(value * 100, 2)}%`;
}
