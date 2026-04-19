export const fmtEUR = (n: number, opts?: { digits?: number }): string =>
  new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: opts?.digits ?? 0,
  }).format(isFinite(n) ? n : 0);

export const fmtPct = (n: number, digits = 2): string =>
  new Intl.NumberFormat("fr-FR", {
    style: "percent",
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(isFinite(n) ? n : 0);

export const fmtNum = (n: number, digits = 0): string =>
  new Intl.NumberFormat("fr-FR", {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(isFinite(n) ? n : 0);
