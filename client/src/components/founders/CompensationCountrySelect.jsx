import React, { useMemo, useState } from "react";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import {
  COMPENSATION_COUNTRIES,
  getCountryByCode,
} from "../../config/compensationCountries";
import { getCurrencyName } from "../../utils/formatMoney";

export function CompensationCountrySelect({
  value,
  currency,
  onChange,
  id = "compensationCountry",
  required = false,
}) {
  const [search, setSearch] = useState("");

  const selectedCountry = getCountryByCode(value);

  const filteredCountries = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return COMPENSATION_COUNTRIES;
    return COMPENSATION_COUNTRIES.filter(
      (c) =>
        c.name.toLowerCase().includes(query) ||
        c.currency.toLowerCase().includes(query) ||
        c.countryCode.toLowerCase().includes(query),
    );
  }, [search]);

  const handleCountryChange = (countryCode) => {
    const country = getCountryByCode(countryCode);
    onChange?.({
      compensationCountry: countryCode,
      currency: country?.currency || "",
    });
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-text-heading">
        Salary country
        {required ? <span className="text-status-error"> *</span> : null}
      </Label>
      <p className="text-xs text-text-muted">Sets the currency for salary fields below.</p>

      <Input
        type="search"
        placeholder="Search countries..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="bg-surface-page border-surface-border focus:border-primary"
        aria-label="Search countries"
      />

      <select
        id={id}
        value={value || ""}
        onChange={(e) => handleCountryChange(e.target.value)}
        className="w-full h-10 rounded-md border border-surface-border bg-surface-page px-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        required={required}
      >
        <option value="">Select country</option>
        {filteredCountries.map((country) => (
          <option key={country.countryCode} value={country.countryCode}>
            {country.name} — {country.currency}
          </option>
        ))}
      </select>

      {currency ? (
        <div className="inline-flex items-center gap-2 rounded-full bg-primary/5 px-3 py-1 text-xs text-text-body ring-1 ring-primary/20">
          <span className="font-medium text-text-heading">Currency:</span>
          <span>
            {getCurrencyName(currency)} ({currency})
          </span>
        </div>
      ) : selectedCountry ? null : (
        <p className="text-xs text-text-muted">Select a country to set your salary currency.</p>
      )}
    </div>
  );
}

export default CompensationCountrySelect;
