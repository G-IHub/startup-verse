const currencyNameCache = new Map();

export function getCurrencySymbol(currency, locale = undefined) {
  if (!currency) return "";
  try {
    const parts = new Intl.NumberFormat(locale, {
      style: "currency",
      currency: String(currency).toUpperCase(),
      currencyDisplay: "narrowSymbol",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).formatToParts(0);
    return parts.find((p) => p.type === "currency")?.value || "";
  } catch {
    return "";
  }
}

export function getCurrencyName(currency, locale = undefined) {
  if (!currency) return "";
  const code = String(currency).toUpperCase();
  if (currencyNameCache.has(code)) return currencyNameCache.get(code);
  try {
    const display = new Intl.DisplayNames([locale || "en"], { type: "currency" });
    const name = display.of(code) || code;
    currencyNameCache.set(code, name);
    return name;
  } catch {
    return code;
  }
}

/** e.g. "NGN (₦)" for form labels */
export function getCurrencyLabel(currency, locale = undefined) {
  if (!currency) return "";
  const code = String(currency).toUpperCase();
  const symbol = getCurrencySymbol(code, locale);
  if (symbol && symbol !== code) return `${code} (${symbol})`;
  return code;
}

export function formatMoney(amount, currency, locale = undefined) {
  if (amount == null || amount === "") return "";
  const numeric = Number(amount);
  if (!Number.isFinite(numeric)) return String(amount);

  if (!currency) {
    return numeric.toLocaleString(locale);
  }

  const code = String(currency).toUpperCase();
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: code,
      maximumFractionDigits: 0,
    }).format(numeric);
  } catch {
    return `${code} ${numeric.toLocaleString(locale)}`;
  }
}

export function getSalaryFieldLabel(baseLabel, currency) {
  if (!currency) return baseLabel;
  return `${baseLabel} (${getCurrencyLabel(currency)})`;
}
