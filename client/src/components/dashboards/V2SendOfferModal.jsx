/**
 * V2SendOfferModal
 * ─────────────────────────────────────────────────────────────────────────────
 * Rebuilt from StartupVerse_Compensation_Modal.html ("Make an offer") — a real
 * 6-step flow: Role → Model → Tiers → KPIs → Equity → Review. Replaces the
 * earlier 3-step SendOfferModal that lived inline in V2TalentMarketplace.jsx.
 *
 * Real vs. informational, spelled out plainly (see CLAUDE.md for the full
 * writeup): every field here is saved for real on the Offer document. But
 * only performance Tier 1 (the base/floor) is mapped into the real
 * TeamMemberProfile.compensation the payroll engine reads — Tiers 2/3 and the
 * weighted KPI list are real, saved, and shown to the candidate, but nothing
 * auto-enforces them yet (no multi-tier payroll, no KPI-scoring engine exists).
 * Equity's cliff/full-vest dates are computed from start date + months, not
 * typed in, so they can't drift from the numeric inputs. The equity value
 * estimate only appears if a real valuation is entered — never guessed.
 */
import React, { useEffect, useMemo, useState } from "react";
import { cn } from "../ui/utils";
import { V2Btn, V2Avatar } from "../shared/v2-primitives";
import { X, ArrowLeft, ArrowRight, Check } from "lucide-react";

const EMPLOYMENT_TYPES = ["Full-time employee", "Part-time", "Contract", "Advisor"];
const WORK_LOCATIONS = ["Remote-first", "On-site", "Hybrid"];
const COMPENSATION_MODELS = [
  { value: "salary", label: "Salary" },
  { value: "equity-only", label: "Equity only" },
  { value: "hybrid", label: "Hybrid" },
  { value: "task-based", label: "Task-based" },
  { value: "revenue-share", label: "Revenue share" },
];
const PAYMENT_SCHEDULES = [
  { value: "1st", label: "1st of each month" },
  { value: "15th", label: "15th of each month" },
  { value: "biweekly", label: "Bi-weekly" },
];
const BONUS_STRUCTURES = [
  { value: "performance-tiers", label: "Performance-based tiers" },
  { value: "milestone", label: "Milestone bonuses" },
  { value: "flat-monthly", label: "Flat monthly bonus" },
  { value: "none", label: "None" },
];
const VESTING_PRESETS = [
  { vestingMonths: 48, cliffMonths: 12, label: "4 years, 1-year cliff" },
  { vestingMonths: 36, cliffMonths: 12, label: "3 years, 1-year cliff" },
  { vestingMonths: 24, cliffMonths: 6, label: "2 years, 6-month cliff" },
  { vestingMonths: 48, cliffMonths: 0, label: "4 years, no cliff" },
];
const ACCELERATED_VESTING_OPTIONS = [
  { value: "none", label: "None" },
  { value: "tier3-accelerate", label: "Tier 3 performance → faster vest" },
  { value: "double-trigger", label: "Double-trigger acceleration" },
];

const DEFAULT_TIERS = [
  { tierNumber: 1, label: "Base performer", completionMin: 60, completionMax: 79, monthlyCash: 0, bonusAmount: 0, qualityScoreThreshold: null, additionalEquityPercent: 0 },
  { tierNumber: 2, label: "High performer", completionMin: 80, completionMax: 89, monthlyCash: 0, bonusAmount: 0, qualityScoreThreshold: 90, additionalEquityPercent: 0 },
  { tierNumber: 3, label: "Exceptional", completionMin: 90, completionMax: null, monthlyCash: 0, bonusAmount: 0, qualityScoreThreshold: 95, additionalEquityPercent: 0 },
];
const DEFAULT_KPIS = [
  { name: "Weekly outcome completion rate", target: "80%+", weight: 40, enabled: true },
  { name: "Code quality score", target: "90%+", weight: 25, enabled: true },
  { name: "Sprint velocity", target: "20 pts/wk", weight: 20, enabled: true },
  { name: "Team collaboration score", target: "4.5/5", weight: 10, enabled: true },
  { name: "Bug rate", target: "<5%", weight: 5, enabled: false },
  { name: "On-time delivery rate", target: "90%+", weight: 5, enabled: false },
];

const FIELD_CLASS = "h-9 w-full rounded-lg border border-v2-border px-3 font-body text-[12px] text-v2-heading outline-none focus:border-v2-blue bg-white";
const STEP_LABELS = ["Role", "Model", "Tiers", "KPIs", "Equity", "Review"];

function Field({ label, children, hint }) {
  return (
    <div>
      <label className="mb-1 block font-body text-[11px] font-medium text-v2-subtle">{label}</label>
      {children}
      {hint ? <p className="mt-1 font-body text-[10px] text-v2-subtle">{hint}</p> : null}
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="rounded-[12px] border border-v2-border bg-white p-4">
      <p className="mb-3 font-body text-[12px] font-medium text-v2-heading">{title}</p>
      <div className="flex flex-col gap-3">{children}</div>
    </div>
  );
}

function addMonths(dateStr, months) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  d.setMonth(d.getMonth() + Number(months || 0));
  return d;
}
function formatDate(d) {
  if (!d) return "—";
  return d.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
}

export default function V2SendOfferModal({ open, onClose, onSubmit, submitting, talentOptions, roleOptions, presetTalentId, candidateName }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(() => initialForm());

  function initialForm() {
    return {
      talentId: "",
      role: "",
      employmentType: EMPLOYMENT_TYPES[0],
      startDate: "",
      probationDays: "90",
      reportingTo: "",
      workLocation: WORK_LOCATIONS[0],
      responsibilities: "",

      compensationModel: "salary",
      salaryAmount: "",
      currency: "NGN",
      paymentSchedule: "1st",
      bonusStructure: "performance-tiers",

      performanceTiers: DEFAULT_TIERS.map((t) => ({ ...t })),
      kpis: DEFAULT_KPIS.map((k) => ({ ...k })),

      equityPercent: "",
      vestingMonths: "48",
      cliffMonths: "12",
      acceleratedVesting: "none",
      valuationAtOffer: "",

      message: "",
      expiryDays: "14",
    };
  }

  useEffect(() => {
    if (open) {
      setStep(1);
      setForm((f) => ({ ...initialForm(), talentId: presetTalentId || "", role: roleOptions[0] || "" }));
    }
  }, [open, presetTalentId, roleOptions]);

  if (!open) return null;

  const usesSalary = ["salary", "hybrid"].includes(form.compensationModel);
  const usesEquity = ["equity-only", "hybrid"].includes(form.compensationModel) || parseFloat(form.equityPercent) > 0;

  const setTier = (idx, patch) => {
    setForm((f) => ({ ...f, performanceTiers: f.performanceTiers.map((t, i) => (i === idx ? { ...t, ...patch } : t)) }));
  };
  const setKpi = (idx, patch) => {
    setForm((f) => ({ ...f, kpis: f.kpis.map((k, i) => (i === idx ? { ...k, ...patch } : k)) }));
  };

  const enabledKpiWeight = form.kpis.filter((k) => k.enabled).reduce((s, k) => s + (Number(k.weight) || 0), 0);

  const cliffDate = usesEquity ? addMonths(form.startDate, form.cliffMonths) : null;
  const fullVestDate = usesEquity ? addMonths(form.startDate, form.vestingMonths) : null;
  const equityPct = parseFloat(form.equityPercent) || 0;
  const valuation = parseFloat(form.valuationAtOffer) || 0;
  const equityEstValue = usesEquity && equityPct > 0 && valuation > 0 ? Math.round((equityPct / 100) * valuation) : null;

  const salaryNum = parseInt(String(form.salaryAmount).replace(/[^0-9]/g, ""), 10) || 0;
  const tier3 = form.performanceTiers[2];
  const maxMonthlyEarning = usesSalary
    ? Math.max(salaryNum, ...form.performanceTiers.map((t) => (Number(t.monthlyCash) || 0) + (Number(t.bonusAmount) || 0)))
    : 0;

  const canContinueStep1 = form.talentId && form.role.trim();
  const totalSteps = 6;

  const handleNext = () => {
    if (step === 1 && !canContinueStep1) return;
    if (step < totalSteps) setStep(step + 1);
  };
  const handleBack = () => { if (step > 1) setStep(step - 1); };

  const handleSend = () => {
    onSubmit({
      talentId: form.talentId,
      role: form.role,
      employmentType: form.employmentType,
      startDate: form.startDate || null,
      probationDays: Number(form.probationDays) || 0,
      reportingTo: form.reportingTo,
      workLocation: form.workLocation,
      responsibilities: form.responsibilities,

      compensationModel: form.compensationModel,
      salaryAmount: usesSalary ? form.salaryAmount : "",
      currency: form.currency,
      paymentSchedule: form.paymentSchedule,
      bonusStructure: form.bonusStructure,

      performanceTiers: form.compensationModel === "task-based" || form.compensationModel === "revenue-share" ? [] : form.performanceTiers,
      kpis: form.kpis,

      equityPercent: usesEquity ? form.equityPercent : "",
      vestingMonths: usesEquity ? Number(form.vestingMonths) || 0 : 0,
      cliffMonths: usesEquity ? Number(form.cliffMonths) || 0 : 0,
      acceleratedVesting: usesEquity ? form.acceleratedVesting : "",
      valuationAtOffer: form.valuationAtOffer || null,

      message: form.message,
      expiresAt: form.expiryDays ? new Date(Date.now() + Number(form.expiryDays) * 86400000).toISOString() : null,
    });
  };

  const talentName = candidateName || talentOptions.find((t) => t.id === form.talentId)?.name || "this candidate";

  return (
    <div className="fixed inset-0 z-[95] flex items-center justify-center bg-black/35" onClick={onClose}>
      <div className="flex max-h-[92vh] w-[640px] flex-col overflow-hidden rounded-2xl bg-white" onClick={(e) => e.stopPropagation()}>
        <div className="shrink-0 border-b border-v2-border px-5 pt-5 pb-3">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="font-body text-[15px] font-medium text-v2-heading">Make an offer</p>
              <p className="font-body text-[11px] text-v2-subtle">Step {step} of {totalSteps} — set up compensation for {talentName}</p>
            </div>
            <button type="button" onClick={onClose} className="flex h-7 w-7 items-center justify-center rounded-md text-v2-muted hover:bg-v2-page"><X className="h-4 w-4" /></button>
          </div>
          <div className="flex gap-1">
            {STEP_LABELS.map((label, i) => (
              <button
                key={label}
                type="button"
                onClick={() => setStep(i + 1)}
                className={cn(
                  "flex-1 border-b-2 pb-1.5 text-center font-body text-[10px]",
                  step === i + 1 ? "border-v2-blue font-medium text-v2-blue" : step > i + 1 ? "border-transparent text-v2-green" : "border-transparent text-v2-subtle",
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto bg-v2-page p-5">
          {step === 1 && (
            <div className="flex flex-col gap-3">
              <Section title="Candidate">
                <Field label="Candidate *">
                  <select value={form.talentId} onChange={(e) => setForm((f) => ({ ...f, talentId: e.target.value }))} className={FIELD_CLASS}>
                    <option value="">Select candidate</option>
                    {talentOptions.map((t) => <option key={t.id} value={t.id}>{t.name}{t.shortlisted ? " (shortlisted)" : ""}</option>)}
                  </select>
                </Field>
              </Section>
              <Section title="Role details">
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Role title *">
                    <select value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))} className={FIELD_CLASS}>
                      <option value="">Select role</option>
                      {roleOptions.map((r) => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </Field>
                  <Field label="Employment type">
                    <select value={form.employmentType} onChange={(e) => setForm((f) => ({ ...f, employmentType: e.target.value }))} className={FIELD_CLASS}>
                      {EMPLOYMENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </Field>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Start date">
                    <input type="date" value={form.startDate} onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))} className={FIELD_CLASS} />
                  </Field>
                  <Field label="Probation period">
                    <select value={form.probationDays} onChange={(e) => setForm((f) => ({ ...f, probationDays: e.target.value }))} className={FIELD_CLASS}>
                      <option value="90">90 days</option>
                      <option value="30">30 days</option>
                      <option value="60">60 days</option>
                      <option value="0">None</option>
                    </select>
                  </Field>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Reporting to">
                    <input value={form.reportingTo} onChange={(e) => setForm((f) => ({ ...f, reportingTo: e.target.value }))} placeholder="e.g. Ade Okonkwo (Founder)" className={FIELD_CLASS} />
                  </Field>
                  <Field label="Work location">
                    <select value={form.workLocation} onChange={(e) => setForm((f) => ({ ...f, workLocation: e.target.value }))} className={FIELD_CLASS}>
                      {WORK_LOCATIONS.map((w) => <option key={w} value={w}>{w}</option>)}
                    </select>
                  </Field>
                </div>
              </Section>
              <Section title="Key responsibilities">
                <textarea
                  value={form.responsibilities}
                  onChange={(e) => setForm((f) => ({ ...f, responsibilities: e.target.value }))}
                  placeholder="What will they own? Tech stack, key decisions, who they'll work closely with..."
                  className={cn(FIELD_CLASS, "h-20 resize-none py-2")}
                />
              </Section>
            </div>
          )}

          {step === 2 && (
            <div className="flex flex-col gap-3">
              <Section title="Choose compensation model">
                <div className="grid grid-cols-5 gap-1.5">
                  {COMPENSATION_MODELS.map((m) => (
                    <button
                      key={m.value}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, compensationModel: m.value }))}
                      className={cn(
                        "rounded-lg border-[1.5px] p-2 text-center font-body text-[10px]",
                        form.compensationModel === m.value ? "border-v2-blue bg-v2-blue-tint text-v2-blue-dark font-medium" : "border-v2-border bg-v2-page text-v2-muted",
                      )}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </Section>
              {usesSalary && (
                <Section title="Base salary">
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Monthly base salary">
                      <input value={form.salaryAmount} onChange={(e) => setForm((f) => ({ ...f, salaryAmount: e.target.value }))} placeholder="280000" className={FIELD_CLASS} />
                    </Field>
                    <Field label="Currency">
                      <select value={form.currency} onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))} className={FIELD_CLASS}>
                        <option value="NGN">NGN (₦)</option>
                        <option value="USD">USD ($)</option>
                        <option value="GHS">GHS (₵)</option>
                      </select>
                    </Field>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Payment schedule">
                      <select value={form.paymentSchedule} onChange={(e) => setForm((f) => ({ ...f, paymentSchedule: e.target.value }))} className={FIELD_CLASS}>
                        {PAYMENT_SCHEDULES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                      </select>
                    </Field>
                    <Field label="Bonus structure">
                      <select value={form.bonusStructure} onChange={(e) => setForm((f) => ({ ...f, bonusStructure: e.target.value }))} className={FIELD_CLASS}>
                        {BONUS_STRUCTURES.map((b) => <option key={b.value} value={b.value}>{b.label}</option>)}
                      </select>
                    </Field>
                  </div>
                  <p className="rounded-[8px] bg-v2-page p-2.5 font-body text-[10px] leading-relaxed text-v2-subtle">
                    Base salary is guaranteed monthly. Tier bonuses (next step) are real, saved figures shown to the candidate — actual monthly payroll is generated from Tier 1 (the base), reviewed and marked paid by you from the Team page.
                  </p>
                </Section>
              )}
              {form.compensationModel === "task-based" || form.compensationModel === "revenue-share" ? (
                <div className="rounded-[10px] bg-v2-amber-tint p-3 font-body text-[11px] text-v2-amber-dark">
                  This compensation model isn't tracked in payroll yet — after acceptance you'll set up their actual pay manually from the Team page.
                </div>
              ) : null}
            </div>
          )}

          {step === 3 && (
            <div className="flex flex-col gap-3">
              <Section title="Performance tiers">
                <p className="-mt-1 font-body text-[10px] text-v2-subtle">
                  Real, saved, shown to the candidate. Only Tier 1 becomes their actual ongoing pay on acceptance — Tiers 2/3 are informational targets until a multi-tier payroll engine exists.
                </p>
                {form.performanceTiers.map((tier, i) => (
                  <div key={tier.tierNumber} className="rounded-[10px] border border-v2-border p-3" style={{ borderLeftWidth: 3, borderLeftColor: i === 0 ? "#d1d5db" : i === 1 ? "#1B4FD8" : "#BA7517" }}>
                    <div className="mb-2 flex items-center gap-2">
                      <span className="rounded-md bg-v2-page px-2 py-0.5 font-body text-[10px] font-medium text-v2-muted">Tier {tier.tierNumber}</span>
                      <input value={tier.label} onChange={(e) => setTier(i, { label: e.target.value })} className="flex-1 border-none bg-transparent font-body text-[12px] font-medium text-v2-heading outline-none" />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Field label="Completion min %">
                        <input type="number" value={tier.completionMin} onChange={(e) => setTier(i, { completionMin: e.target.value })} className={FIELD_CLASS} />
                      </Field>
                      <Field label="Completion max % (blank = open)">
                        <input type="number" value={tier.completionMax ?? ""} onChange={(e) => setTier(i, { completionMax: e.target.value === "" ? null : e.target.value })} className={FIELD_CLASS} />
                      </Field>
                      <Field label="Monthly cash">
                        <input type="number" value={tier.monthlyCash} onChange={(e) => setTier(i, { monthlyCash: e.target.value })} placeholder={i === 0 ? salaryNum || "0" : "0"} className={FIELD_CLASS} />
                      </Field>
                      <Field label="Bonus amount">
                        <input type="number" value={tier.bonusAmount} onChange={(e) => setTier(i, { bonusAmount: e.target.value })} className={FIELD_CLASS} />
                      </Field>
                      {i > 0 && (
                        <Field label="Quality score threshold %">
                          <input type="number" value={tier.qualityScoreThreshold ?? ""} onChange={(e) => setTier(i, { qualityScoreThreshold: e.target.value === "" ? null : e.target.value })} className={FIELD_CLASS} />
                        </Field>
                      )}
                      {i === 2 && (
                        <Field label="Additional equity bonus %">
                          <input type="number" step="0.1" value={tier.additionalEquityPercent} onChange={(e) => setTier(i, { additionalEquityPercent: e.target.value })} className={FIELD_CLASS} />
                        </Field>
                      )}
                    </div>
                  </div>
                ))}
                <p className="rounded-[8px] bg-v2-page p-2 font-body text-[10px] text-v2-subtle">
                  Tier classification would be calculated at month end from real task-completion data once a multi-tier payroll pass exists — for now, review and set actual pay manually each month from the Team page's payroll tool.
                </p>
              </Section>
            </div>
          )}

          {step === 4 && (
            <div className="flex flex-col gap-3">
              <Section title="Select KPIs">
                <p className="-mt-1 font-body text-[10px] text-v2-subtle">
                  Real, saved, and shown to the candidate as what's being tracked — not yet auto-scored anywhere (no KPI-tracking engine exists in the app today).
                </p>
                <div className="flex flex-col gap-1.5">
                  {form.kpis.map((kpi, i) => (
                    <div key={i} className="flex items-center gap-2 rounded-[8px] border border-v2-border bg-white px-3 py-2">
                      <input type="checkbox" checked={kpi.enabled} onChange={(e) => setKpi(i, { enabled: e.target.checked })} className="h-4 w-4 accent-v2-blue" />
                      <input value={kpi.name} onChange={(e) => setKpi(i, { name: e.target.value })} className={cn("flex-1 border-none bg-transparent font-body text-[12px] outline-none", kpi.enabled ? "text-v2-heading" : "text-v2-subtle")} />
                      <input value={kpi.target} onChange={(e) => setKpi(i, { target: e.target.value })} placeholder="Target" className="w-24 rounded-md border border-v2-border px-2 py-1 font-body text-[10px] text-v2-muted outline-none" />
                      <div className="flex w-16 items-center rounded-md border border-v2-border px-1.5 py-1">
                        <input type="number" value={kpi.weight} onChange={(e) => setKpi(i, { weight: e.target.value })} className="w-full border-none bg-transparent text-right font-body text-[11px] text-v2-heading outline-none" />
                        <span className="font-body text-[10px] text-v2-subtle">%</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between border-t border-v2-border pt-2 font-body text-[11px]">
                  <span className="text-v2-muted">Total weight (enabled)</span>
                  <span className={cn("font-medium", enabledKpiWeight === 100 ? "text-v2-green" : "text-v2-amber-dark")}>
                    {enabledKpiWeight}% {enabledKpiWeight !== 100 ? "— aim for 100%" : ""}
                  </span>
                </div>
              </Section>
            </div>
          )}

          {step === 5 && (
            <div className="flex flex-col gap-3">
              {!usesEquity ? (
                <div className="rounded-[10px] bg-v2-page p-4 text-center font-body text-[12px] text-v2-muted">
                  No equity in this offer's compensation model — switch to Hybrid or Equity only on the Model step to add a grant.
                </div>
              ) : (
                <Section title="Equity grant">
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Equity percentage">
                      <input type="number" step="0.1" value={form.equityPercent} onChange={(e) => setForm((f) => ({ ...f, equityPercent: e.target.value }))} placeholder="2.5" className={FIELD_CLASS} />
                    </Field>
                    <Field label="Vesting schedule">
                      <select
                        value={`${form.vestingMonths}-${form.cliffMonths}`}
                        onChange={(e) => {
                          const preset = VESTING_PRESETS.find((p) => `${p.vestingMonths}-${p.cliffMonths}` === e.target.value);
                          if (preset) setForm((f) => ({ ...f, vestingMonths: String(preset.vestingMonths), cliffMonths: String(preset.cliffMonths) }));
                        }}
                        className={FIELD_CLASS}
                      >
                        {VESTING_PRESETS.map((p) => <option key={p.label} value={`${p.vestingMonths}-${p.cliffMonths}`}>{p.label}</option>)}
                      </select>
                    </Field>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Cliff date" hint="Computed from start date + cliff — not editable directly.">
                      <div className={cn(FIELD_CLASS, "flex items-center bg-v2-page text-v2-muted")}>{form.startDate ? formatDate(cliffDate) : "Set a start date first"}</div>
                    </Field>
                    <Field label="Full vest date" hint="Computed the same way.">
                      <div className={cn(FIELD_CLASS, "flex items-center bg-v2-page text-v2-muted")}>{form.startDate ? formatDate(fullVestDate) : "Set a start date first"}</div>
                    </Field>
                  </div>
                  <Field label="Accelerated vesting">
                    <select value={form.acceleratedVesting} onChange={(e) => setForm((f) => ({ ...f, acceleratedVesting: e.target.value }))} className={FIELD_CLASS}>
                      {ACCELERATED_VESTING_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </Field>
                  <Field label="Company valuation (optional)" hint="Only used to show the candidate an estimated dollar value of their grant — left blank shows no estimate, never a guess.">
                    <input type="number" value={form.valuationAtOffer} onChange={(e) => setForm((f) => ({ ...f, valuationAtOffer: e.target.value }))} placeholder="e.g. 2000000" className={FIELD_CLASS} />
                  </Field>
                  {equityEstValue != null && (
                    <div className="rounded-[8px] bg-v2-blue-tint p-2.5 font-body text-[11px] text-v2-blue-dark">
                      Estimated grant value: {form.currency || "$"} {equityEstValue.toLocaleString()} at the entered valuation.
                    </div>
                  )}
                </Section>
              )}
            </div>
          )}

          {step === 6 && (
            <div className="flex flex-col gap-3">
              <Section title={`Offer summary — ${talentName}`}>
                <div className="flex flex-col gap-1">
                  <SummaryRow k="Role" v={form.role || "—"} />
                  <SummaryRow k="Start date" v={form.startDate ? formatDate(new Date(form.startDate)) : "—"} />
                  <SummaryRow k="Employment type" v={`${form.employmentType} · ${form.workLocation}`} />
                  <SummaryRow k="Probation" v={form.probationDays === "0" ? "None" : `${form.probationDays} days`} />
                  {usesSalary && <SummaryRow k="Base salary" v={salaryNum ? `${form.currency} ${salaryNum.toLocaleString()}/month` : "—"} highlight />}
                  {form.performanceTiers.slice(1).map((t) => (t.monthlyCash > 0 ? (
                    <SummaryRow key={t.tierNumber} k={`${t.label} (Tier ${t.tierNumber})`} v={`${form.currency} ${Number(t.monthlyCash).toLocaleString()}/month${t.bonusAmount ? ` (+${Number(t.bonusAmount).toLocaleString()})` : ""}`} />
                  ) : null))}
                  {usesEquity && <SummaryRow k="Equity grant" v={`${form.equityPercent || 0}% · ${form.vestingMonths}mo vest, ${form.cliffMonths}mo cliff`} highlight />}
                  {equityEstValue != null && <SummaryRow k="Equity est. value" v={`${form.currency || "$"} ${equityEstValue.toLocaleString()} at current valuation`} />}
                  <SummaryRow k="KPIs tracked" v={`${form.kpis.filter((k) => k.enabled).length} metrics · not yet auto-scored`} />
                  {usesSalary && <SummaryRow k="Payment date" v={PAYMENT_SCHEDULES.find((p) => p.value === form.paymentSchedule)?.label || "—"} />}
                </div>
                {maxMonthlyEarning > 0 && (
                  <div className="flex items-center justify-between rounded-[8px] bg-v2-blue-tint px-3 py-2">
                    <span className="font-body text-[11px] font-medium text-v2-blue-dark">Maximum monthly earning potential (Tier {tier3.monthlyCash > 0 ? 3 : 1})</span>
                    <span className="font-heading text-[16px] font-medium text-v2-blue-dark">{form.currency} {maxMonthlyEarning.toLocaleString()}</span>
                  </div>
                )}
              </Section>
              <Section title="Personal message & expiry">
                <Field label="Personal message">
                  <textarea value={form.message} onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))} placeholder="We'd love to have you join us..." className={cn(FIELD_CLASS, "h-20 resize-none py-2")} />
                </Field>
                <Field label="Offer expires in">
                  <select value={form.expiryDays} onChange={(e) => setForm((f) => ({ ...f, expiryDays: e.target.value }))} className={FIELD_CLASS}>
                    <option value="7">7 days</option>
                    <option value="14">14 days</option>
                    <option value="30">30 days</option>
                    <option value="">No expiry</option>
                  </select>
                </Field>
              </Section>
              <Section title="Before you send">
                <div className="flex flex-col gap-1.5">
                  {[
                    `${talentName} sees this real offer and can accept or decline it from their account.`,
                    `Once accepted, ${talentName} is really added to your startup as a team member, with a real onboarding checklist assigned automatically.`,
                    "Their ongoing compensation is set from Tier 1 above — you can adjust it any time from the Team page.",
                    "Tiers 2/3 and the KPI list are saved and visible to them, but aren't auto-scored yet — review performance manually each month.",
                  ].map((line) => (
                    <div key={line} className="flex items-start gap-2 font-body text-[11px] text-v2-muted">
                      <Check className="mt-0.5 h-3 w-3 shrink-0 text-v2-green" />
                      <span>{line}</span>
                    </div>
                  ))}
                </div>
              </Section>
            </div>
          )}
        </div>

        <div className="flex shrink-0 items-center justify-between gap-2 border-t border-v2-border px-5 py-3.5">
          {step > 1 ? <V2Btn variant="secondary" size="sm" onClick={handleBack}><ArrowLeft className="h-3.5 w-3.5" /> Back</V2Btn> : <span />}
          {step < totalSteps ? (
            <V2Btn variant="primary" size="sm" disabled={step === 1 && !canContinueStep1} onClick={handleNext}>Continue <ArrowRight className="h-3.5 w-3.5" /></V2Btn>
          ) : (
            <V2Btn variant="primary" size="sm" disabled={submitting || !canContinueStep1} onClick={handleSend}>
              {submitting ? "Sending…" : "Send offer"}
            </V2Btn>
          )}
        </div>
      </div>
    </div>
  );
}

function SummaryRow({ k, v, highlight }) {
  return (
    <div className="flex items-center justify-between border-b border-v2-border py-1.5 last:border-0 font-body text-[12px]">
      <span className="text-v2-muted">{k}</span>
      <span className={cn("font-medium", highlight ? "text-v2-blue" : "text-v2-heading")}>{v}</span>
    </div>
  );
}
