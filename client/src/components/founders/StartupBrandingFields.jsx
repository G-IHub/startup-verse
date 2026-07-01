import React, { useRef } from "react";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Button } from "../ui/button";
import { Loader2, Palette, Sparkles, Upload, X } from "lucide-react";

const SIZE_CLASSES = {
  sm: "h-11 w-11 rounded-xl text-base",
  md: "h-20 w-20 rounded-2xl text-3xl",
  lg: "h-28 w-28 rounded-2xl text-4xl",
};

const BRAND_COLOR_PRESETS = [
  "#3A5AFE",
  "#6366F1",
  "#0EA5E9",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#8B5CF6",
  "#111827",
];

function resolveBrandColor(brandColor) {
  return brandColor && /^#[0-9A-Fa-f]{6}$/.test(brandColor)
    ? brandColor
    : "#3A5AFE";
}

const fieldClass =
  "mt-2 h-11 rounded-xl border-surface-border bg-white font-body text-sm shadow-none transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/15";

/** Logo or initial avatar for startup listings */
export function StartupAvatar({
  title,
  logoUrl,
  brandColor,
  size = "md",
  className = "",
}) {
  const sizeClass = SIZE_CLASSES[size] || SIZE_CLASSES.md;
  const accent = resolveBrandColor(brandColor);

  if (logoUrl) {
    return (
      <img
        src={logoUrl}
        alt={title ? `${title} logo` : "Startup logo"}
        className={`${sizeClass} shrink-0 object-cover ring-2 ring-white shadow-md ${className}`}
        style={{ boxShadow: `0 8px 24px -8px ${accent}66` }}
      />
    );
  }

  return (
    <div
      className={`flex shrink-0 items-center justify-center font-heading font-bold shadow-md ring-2 ring-white ${sizeClass} ${className}`}
      style={{
        color: accent,
        background: `linear-gradient(145deg, ${accent}22 0%, ${accent}10 100%)`,
        boxShadow: `0 8px 24px -10px ${accent}55`,
      }}
    >
      {title?.charAt(0).toUpperCase() || "S"}
    </div>
  );
}

function BrandingPreview({ title, tagline, logoUrl, brandColor }) {
  const accent = resolveBrandColor(brandColor);
  const displayName = title?.trim() || "Your startup";

  return (
    <div
      className="relative overflow-hidden rounded-2xl border border-surface-border/80 bg-white p-4 shadow-soft"
      style={{
        backgroundImage: `linear-gradient(135deg, ${accent}0c 0%, transparent 55%)`,
      }}
    >
      <div
        className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full opacity-40 blur-2xl"
        style={{ backgroundColor: accent }}
        aria-hidden
      />
      <p className="mb-3 font-body text-[10px] font-semibold uppercase tracking-[0.14em] text-text-muted">
        Listing preview
      </p>
      <div className="flex items-center gap-3">
        <StartupAvatar
          title={displayName}
          logoUrl={logoUrl}
          brandColor={accent}
          size="sm"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate font-heading text-base font-bold text-text-heading">
            {displayName}
          </p>
          <p
            className="truncate text-sm font-medium"
            style={{ color: accent }}
          >
            {tagline?.trim() || "Your tagline appears here"}
          </p>
          <p className="mt-0.5 truncate text-xs text-text-muted">
            Talent browse · public listing
          </p>
        </div>
      </div>
    </div>
  );
}

export function StartupBrandingFields({
  title,
  tagline,
  brandColor,
  logoUrl,
  onChange,
  onLogoUpload,
  uploadingLogo = false,
}) {
  const fileInputRef = useRef(null);
  const accent = resolveBrandColor(brandColor);

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file || !onLogoUpload) return;
    await onLogoUpload(file);
    event.target.value = "";
  };

  return (
    <div className="space-y-6">
      <BrandingPreview
        title={title}
        tagline={tagline}
        logoUrl={logoUrl}
        brandColor={accent}
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,220px)_1fr] lg:gap-8">
        {/* Logo dropzone */}
        <div className="flex flex-col gap-3">
          <Label className="font-body text-xs font-semibold uppercase tracking-[0.08em] text-text-muted">
            Logo
          </Label>
          <button
            type="button"
            disabled={uploadingLogo}
            onClick={() => fileInputRef.current?.click()}
            className="group relative flex min-h-[220px] flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-surface-border bg-surface-page/80 p-5 text-center transition-all duration-200 hover:border-primary/50 hover:bg-primary/[0.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:cursor-wait"
            style={
              logoUrl
                ? {
                    borderColor: `${accent}44`,
                    background: `linear-gradient(180deg, ${accent}08 0%, transparent 100%)`,
                  }
                : undefined
            }
          >
            {uploadingLogo ? (
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            ) : logoUrl ? (
              <StartupAvatar
                title={title}
                logoUrl={logoUrl}
                brandColor={accent}
                size="lg"
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-surface-border transition-transform duration-200 group-hover:scale-105">
                <Upload className="h-8 w-8 text-primary/70" />
              </div>
            )}
            <div>
              <p className="font-body text-sm font-semibold text-text-heading">
                {logoUrl ? "Replace logo" : "Upload logo"}
              </p>
              <p className="mt-1 font-body text-xs text-text-muted">
                PNG or JPG · square · max 5MB
              </p>
            </div>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
          {logoUrl ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={uploadingLogo}
              onClick={() => onChange("logoUrl", "")}
              className="w-full rounded-xl text-text-muted hover:text-status-error"
            >
              <X className="mr-2 h-4 w-4" />
              Remove logo
            </Button>
          ) : null}
        </div>

        {/* Identity fields */}
        <div className="space-y-5">
          <div>
            <Label
              htmlFor="startup-name"
              className="font-body text-xs font-semibold uppercase tracking-[0.08em] text-text-muted"
            >
              Startup name <span className="text-status-error">*</span>
            </Label>
            <Input
              id="startup-name"
              placeholder="e.g., Acme Health"
              value={title}
              onChange={(e) => onChange("title", e.target.value)}
              className={fieldClass}
            />
          </div>

          <div>
            <Label
              htmlFor="tagline"
              className="flex items-center gap-2 font-body text-xs font-semibold uppercase tracking-[0.08em] text-text-muted"
            >
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Tagline
              <span className="normal-case tracking-normal text-text-muted/80">
                · optional
              </span>
            </Label>
            <Input
              id="tagline"
              placeholder="One line that captures your mission"
              value={tagline}
              onChange={(e) => onChange("tagline", e.target.value)}
              maxLength={160}
              className={fieldClass}
            />
            <div className="mt-2 flex items-center justify-between gap-2">
              <p className="font-body text-xs text-text-muted">
                Shown under your name on talent listings
              </p>
              <span className="font-mono text-[11px] text-text-muted">
                {tagline.length}/160
              </span>
            </div>
          </div>

          <div>
            <Label
              htmlFor="brandColor"
              className="flex items-center gap-2 font-body text-xs font-semibold uppercase tracking-[0.08em] text-text-muted"
            >
              <Palette className="h-3.5 w-3.5 text-primary" />
              Brand color
              <span className="normal-case tracking-normal text-text-muted/80">
                · optional
              </span>
            </Label>
            <div className="mt-3 flex flex-wrap gap-2">
              {BRAND_COLOR_PRESETS.map((preset) => {
                const selected = resolveBrandColor(brandColor) === preset;
                return (
                  <button
                    key={preset}
                    type="button"
                    aria-label={`Use brand color ${preset}`}
                    aria-pressed={selected}
                    onClick={() => onChange("brandColor", preset)}
                    className={`h-9 w-9 rounded-full transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${
                      selected
                        ? "scale-110 ring-2 ring-offset-2 ring-offset-white"
                        : "hover:scale-105"
                    }`}
                    style={{
                      backgroundColor: preset,
                      ...(selected ? { ringColor: preset } : {}),
                    }}
                  />
                );
              })}
            </div>
            <div className="mt-3 flex items-center gap-3">
              <div
                className="relative h-11 w-11 shrink-0 cursor-pointer overflow-hidden rounded-xl ring-1 ring-surface-border transition-shadow hover:ring-primary/40"
                style={{ backgroundColor: accent }}
              >
                <input
                  id="brandColor"
                  type="color"
                  value={accent}
                  onChange={(e) => onChange("brandColor", e.target.value)}
                  className="absolute inset-0 h-[150%] w-[150%] -translate-x-1/4 -translate-y-1/4 cursor-pointer border-0 bg-transparent"
                  aria-label="Custom brand color"
                />
              </div>
              <Input
                value={brandColor}
                onChange={(e) => onChange("brandColor", e.target.value)}
                placeholder="#3A5AFE"
                maxLength={7}
                className={`${fieldClass} max-w-[148px] font-mono`}
              />
              <p className="hidden font-body text-xs text-text-muted sm:block">
                Accents your avatar and listing card
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
