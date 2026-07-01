/** Country → ISO 4217 currency mapping for compensation salary fields. */
export const COMPENSATION_COUNTRIES = [
  { countryCode: "DZ", name: "Algeria", currency: "DZD" },
  { countryCode: "AO", name: "Angola", currency: "AOA" },
  { countryCode: "AR", name: "Argentina", currency: "ARS" },
  { countryCode: "AU", name: "Australia", currency: "AUD" },
  { countryCode: "AT", name: "Austria", currency: "EUR" },
  { countryCode: "BH", name: "Bahrain", currency: "BHD" },
  { countryCode: "BD", name: "Bangladesh", currency: "BDT" },
  { countryCode: "BE", name: "Belgium", currency: "EUR" },
  { countryCode: "BJ", name: "Benin", currency: "XOF" },
  { countryCode: "BW", name: "Botswana", currency: "BWP" },
  { countryCode: "BR", name: "Brazil", currency: "BRL" },
  { countryCode: "BF", name: "Burkina Faso", currency: "XOF" },
  { countryCode: "BI", name: "Burundi", currency: "BIF" },
  { countryCode: "CM", name: "Cameroon", currency: "XAF" },
  { countryCode: "CA", name: "Canada", currency: "CAD" },
  { countryCode: "CV", name: "Cape Verde", currency: "CVE" },
  { countryCode: "CF", name: "Central African Republic", currency: "XAF" },
  { countryCode: "TD", name: "Chad", currency: "XAF" },
  { countryCode: "CL", name: "Chile", currency: "CLP" },
  { countryCode: "CN", name: "China", currency: "CNY" },
  { countryCode: "CO", name: "Colombia", currency: "COP" },
  { countryCode: "CG", name: "Congo", currency: "XAF" },
  { countryCode: "CD", name: "Congo (DRC)", currency: "CDF" },
  { countryCode: "CI", name: "Côte d'Ivoire", currency: "XOF" },
  { countryCode: "HR", name: "Croatia", currency: "EUR" },
  { countryCode: "CY", name: "Cyprus", currency: "EUR" },
  { countryCode: "CZ", name: "Czech Republic", currency: "CZK" },
  { countryCode: "DK", name: "Denmark", currency: "DKK" },
  { countryCode: "EG", name: "Egypt", currency: "EGP" },
  { countryCode: "EE", name: "Estonia", currency: "EUR" },
  { countryCode: "ET", name: "Ethiopia", currency: "ETB" },
  { countryCode: "FI", name: "Finland", currency: "EUR" },
  { countryCode: "FR", name: "France", currency: "EUR" },
  { countryCode: "GA", name: "Gabon", currency: "XAF" },
  { countryCode: "GM", name: "Gambia", currency: "GMD" },
  { countryCode: "DE", name: "Germany", currency: "EUR" },
  { countryCode: "GH", name: "Ghana", currency: "GHS" },
  { countryCode: "GR", name: "Greece", currency: "EUR" },
  { countryCode: "GN", name: "Guinea", currency: "GNF" },
  { countryCode: "HK", name: "Hong Kong", currency: "HKD" },
  { countryCode: "HU", name: "Hungary", currency: "HUF" },
  { countryCode: "IN", name: "India", currency: "INR" },
  { countryCode: "ID", name: "Indonesia", currency: "IDR" },
  { countryCode: "IE", name: "Ireland", currency: "EUR" },
  { countryCode: "IL", name: "Israel", currency: "ILS" },
  { countryCode: "IT", name: "Italy", currency: "EUR" },
  { countryCode: "JP", name: "Japan", currency: "JPY" },
  { countryCode: "JO", name: "Jordan", currency: "JOD" },
  { countryCode: "KE", name: "Kenya", currency: "KES" },
  { countryCode: "KW", name: "Kuwait", currency: "KWD" },
  { countryCode: "LB", name: "Lebanon", currency: "LBP" },
  { countryCode: "LR", name: "Liberia", currency: "LRD" },
  { countryCode: "LY", name: "Libya", currency: "LYD" },
  { countryCode: "LT", name: "Lithuania", currency: "EUR" },
  { countryCode: "LU", name: "Luxembourg", currency: "EUR" },
  { countryCode: "MG", name: "Madagascar", currency: "MGA" },
  { countryCode: "MW", name: "Malawi", currency: "MWK" },
  { countryCode: "MY", name: "Malaysia", currency: "MYR" },
  { countryCode: "ML", name: "Mali", currency: "XOF" },
  { countryCode: "MU", name: "Mauritius", currency: "MUR" },
  { countryCode: "MX", name: "Mexico", currency: "MXN" },
  { countryCode: "MA", name: "Morocco", currency: "MAD" },
  { countryCode: "MZ", name: "Mozambique", currency: "MZN" },
  { countryCode: "NA", name: "Namibia", currency: "NAD" },
  { countryCode: "NL", name: "Netherlands", currency: "EUR" },
  { countryCode: "NZ", name: "New Zealand", currency: "NZD" },
  { countryCode: "NE", name: "Niger", currency: "XOF" },
  { countryCode: "NG", name: "Nigeria", currency: "NGN" },
  { countryCode: "NO", name: "Norway", currency: "NOK" },
  { countryCode: "OM", name: "Oman", currency: "OMR" },
  { countryCode: "PK", name: "Pakistan", currency: "PKR" },
  { countryCode: "PH", name: "Philippines", currency: "PHP" },
  { countryCode: "PL", name: "Poland", currency: "PLN" },
  { countryCode: "PT", name: "Portugal", currency: "EUR" },
  { countryCode: "QA", name: "Qatar", currency: "QAR" },
  { countryCode: "RO", name: "Romania", currency: "RON" },
  { countryCode: "RW", name: "Rwanda", currency: "RWF" },
  { countryCode: "SA", name: "Saudi Arabia", currency: "SAR" },
  { countryCode: "SN", name: "Senegal", currency: "XOF" },
  { countryCode: "RS", name: "Serbia", currency: "RSD" },
  { countryCode: "SG", name: "Singapore", currency: "SGD" },
  { countryCode: "ZA", name: "South Africa", currency: "ZAR" },
  { countryCode: "KR", name: "South Korea", currency: "KRW" },
  { countryCode: "ES", name: "Spain", currency: "EUR" },
  { countryCode: "LK", name: "Sri Lanka", currency: "LKR" },
  { countryCode: "SE", name: "Sweden", currency: "SEK" },
  { countryCode: "CH", name: "Switzerland", currency: "CHF" },
  { countryCode: "TZ", name: "Tanzania", currency: "TZS" },
  { countryCode: "TH", name: "Thailand", currency: "THB" },
  { countryCode: "TG", name: "Togo", currency: "XOF" },
  { countryCode: "TN", name: "Tunisia", currency: "TND" },
  { countryCode: "TR", name: "Turkey", currency: "TRY" },
  { countryCode: "UG", name: "Uganda", currency: "UGX" },
  { countryCode: "UA", name: "Ukraine", currency: "UAH" },
  { countryCode: "AE", name: "United Arab Emirates", currency: "AED" },
  { countryCode: "GB", name: "United Kingdom", currency: "GBP" },
  { countryCode: "US", name: "United States", currency: "USD" },
  { countryCode: "VN", name: "Vietnam", currency: "VND" },
  { countryCode: "ZM", name: "Zambia", currency: "ZMW" },
  { countryCode: "ZW", name: "Zimbabwe", currency: "ZWL" },
].sort((a, b) => a.name.localeCompare(b.name));

const countryByCode = new Map(
  COMPENSATION_COUNTRIES.map((c) => [c.countryCode, c]),
);

export function getCountryByCode(countryCode) {
  if (!countryCode) return null;
  return countryByCode.get(String(countryCode).toUpperCase()) || null;
}

export function getCurrencyForCountry(countryCode) {
  return getCountryByCode(countryCode)?.currency || "";
}

export function findCountryByCurrency(currency, preferredCountryCode) {
  if (!currency) return null;
  const code = String(currency).toUpperCase();
  if (preferredCountryCode) {
    const preferred = getCountryByCode(preferredCountryCode);
    if (preferred?.currency === code) return preferred;
  }
  return COMPENSATION_COUNTRIES.find((c) => c.currency === code) || null;
}

export function resolveCompensationCountryFromOffer(offer) {
  if (!offer) return { compensationCountry: "", currency: "" };
  const storedCountry = offer.compensationCountry || "";
  const currency = offer.currency || "";
  if (storedCountry) {
    return {
      compensationCountry: storedCountry,
      currency: getCurrencyForCountry(storedCountry) || currency,
    };
  }
  if (currency) {
    const match = findCountryByCurrency(currency);
    return {
      compensationCountry: match?.countryCode || "",
      currency,
    };
  }
  return { compensationCountry: "", currency: "" };
}
