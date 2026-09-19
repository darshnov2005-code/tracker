export function formatINR(value: number, options?: Intl.NumberFormatOptions): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
    ...options,
  }).format(Number.isFinite(value) ? value : 0)
}

export function formatNumber(value: number, maxFraction = 3): string {
  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: maxFraction,
  }).format(Number.isFinite(value) ? value : 0)
}

export function formatPercent(value: number): string {
  const v = Number.isFinite(value) ? value : 0
  return `${v >= 0 ? "+" : ""}${v.toFixed(2)}%`
}
