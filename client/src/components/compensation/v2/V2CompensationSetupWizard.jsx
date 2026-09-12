/**
 * V2CompensationSetupWizard
 * V2-styled twin of ../CompensationSetupWizard.jsx — same state, same
 * handleNext/handleBack/handleComplete logic, same onComplete(config) shape.
 * Only the presentational layer changed: Radix Dialog/Select/Checkbox/
 * RadioGroup replaced with plain elements + V2 tokens, matching V2Team.jsx's
 * own modal conventions (fixed overlay + white rounded-2xl panel, native
 * inputs/selects, V2Btn for actions). No gradients — flat V2 palette only.
 */
import React, { useState } from "react";
import { cn } from "../../ui/utils";
import { V2Btn } from "../../shared/v2-primitives";
import {
  ArrowLeft,
  Check,
  Info,
  AlertCircle,
  TrendingUp,
  DollarSign,
  Clock,
  Layers,
  HeartHandshake,
  Settings2,
  ClipboardList,
  Sparkles,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";

function V2Label({ htmlFor, className, children }) {
  return (
    <label htmlFor={htmlFor} className={cn("mb-1 block font-body text-[12px] font-medium text-v2-muted", className)}>
      {children}
    </label>
  );
}

function V2Input(props) {
  return (
    <input
      {...props}
      className={cn(
        "h-9 w-full rounded-lg border border-v2-border px-3 font-body text-[12px] text-v2-heading outline-none focus:border-v2-blue",
        props.className,
      )}
    />
  );
}

function V2Select({ value, onChange, children, className }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        "h-9 w-full rounded-lg border border-v2-border bg-white px-3 font-body text-[12px] text-v2-heading outline-none focus:border-v2-blue",
        className,
      )}
    >
      {children}
    </select>
  );
}

function V2Checkbox({ checked, onChange, id }) {
  return (
    <input
      id={id}
      type="checkbox"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      className="h-4 w-4 shrink-0 accent-v2-blue"
    />
  );
}

export default function V2CompensationSetupWizard({
  isOpen,
  onClose,
  teamMemberName,
  teamMemberId,
  founderId,
  startupId,
  onComplete,
}) {
  const [step, setStep] = useState(1);
  const [compensationType, setCompensationType] = useState("");

  // Equity configuration
  const [equityTotal, setEquityTotal] = useState("2.5");
  const [vestingPeriod, setVestingPeriod] = useState("12");
  const [cliffEnabled, setCliffEnabled] = useState(true);
  const [cliffPeriod, setCliffPeriod] = useState("3");
  const [vestingFrequency, setVestingFrequency] = useState("monthly");
  const [equityPerformanceGated, setEquityPerformanceGated] = useState(true);
  const [equityThreshold, setEquityThreshold] = useState("80");
  const [equityPartialVesting, setEquityPartialVesting] = useState(false);
  const [equityPartialScale, setEquityPartialScale] = useState([
    { minCompletion: 60, maxCompletion: 79, vestingPercentage: 50 },
  ]);

  // Fixed payment configuration
  const [fixedPaymentType, setFixedPaymentType] = useState("monthly");
  const [fixedAmount, setFixedAmount] = useState("3000");
  const [fixedPerformanceGated, setFixedPerformanceGated] = useState(true);
  const [fixedThreshold, setFixedThreshold] = useState("80");
  const [fixedPartialPayments, setFixedPartialPayments] = useState(true);
  const [fixedPartialScale, setFixedPartialScale] = useState([
    { minCompletion: 60, maxCompletion: 79, paymentPercentage: 70 },
    { minCompletion: 40, maxCompletion: 59, paymentPercentage: 40 },
  ]);
  const [paymentDay, setPaymentDay] = useState("last");

  // Hourly rate configuration
  const [hourlyRate, setHourlyRate] = useState("50");
  const [hourTracking, setHourTracking] = useState("self-report");
  const [hourlyPerformanceGated, setHourlyPerformanceGated] = useState(true);
  const [hourlyThreshold, setHourlyThreshold] = useState("75");
  const [hourCap, setHourCap] = useState(true);
  const [maxHoursPerWeek, setMaxHoursPerWeek] = useState("40");
  const [paymentFrequency, setPaymentFrequency] = useState("weekly");

  const totalSteps = compensationType === "equity-fixed" ? 4 : 3;

  const handleNext = () => {
    if (step === 1 && !compensationType) {
      toast.error("Please select a compensation type");
      return;
    }
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      handleComplete();
    }
  };
  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };
  const handleComplete = () => {
    const config = { type: compensationType };
    if (compensationType === "equity" || compensationType === "equity-fixed") {
      config.equity = {
        totalEquity: equityTotal,
        vestingPeriod,
        cliffEnabled,
        cliffPeriod,
        vestingFrequency,
        performanceGated: equityPerformanceGated,
        threshold: equityThreshold,
        partialVesting: equityPartialVesting,
        partialScale: equityPartialVesting ? equityPartialScale : null,
      };
    }
    if (compensationType === "fixed" || compensationType === "equity-fixed") {
      config.fixed = {
        paymentType: fixedPaymentType,
        amount: fixedAmount,
        performanceGated: fixedPerformanceGated,
        threshold: fixedThreshold,
        partialPayments: fixedPartialPayments,
        partialScale: fixedPartialPayments ? fixedPartialScale : null,
        paymentDay,
      };
    }
    if (compensationType === "hourly") {
      config.hourly = {
        rate: hourlyRate,
        tracking: hourTracking,
        performanceGated: hourlyPerformanceGated,
        threshold: hourlyThreshold,
        hourCap,
        maxHoursPerWeek,
        paymentFrequency,
      };
    }
    if (compensationType === "unpaid") config.unpaid = true;
    onComplete(config);
  };

  const compensationOptions = [
    { value: "equity", title: "Equity Only", description: "Offer equity compensation with a vesting schedule", bestFor: "Early team, high risk / high reward", icon: TrendingUp, tint: "bg-v2-blue-tint text-v2-blue" },
    { value: "fixed", title: "Fixed Payment", description: "Monthly stipend or one-time payment", bestFor: "Contractors, specific roles", icon: DollarSign, tint: "bg-v2-green-tint text-v2-green-dark" },
    { value: "hourly", title: "Hourly Rate", description: "Pay by the hour worked", bestFor: "Part-time, flexible roles", icon: Clock, tint: "bg-v2-amber-tint text-v2-amber-dark" },
    { value: "equity-fixed", title: "Equity + Fixed Payment", description: "Combine equity with cash compensation", bestFor: "Key hires who need income", icon: Layers, tint: "bg-v2-purple-tint text-v2-purple-dark" },
    { value: "unpaid", title: "Unpaid / Volunteer", description: "No immediate monetary compensation", bestFor: "Co-founders, interns", icon: HeartHandshake, tint: "bg-red-50 text-red-600" },
  ];

  function RadioDot({ active }) {
    return (
      <span className={cn("flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2", active ? "border-v2-blue" : "border-v2-border")}>
        {active ? <span className="h-2 w-2 rounded-full bg-v2-blue" /> : null}
      </span>
    );
  }

  const renderStep1 = () => (
    <div className="space-y-5">
      <div>
        <h3 className="font-heading text-lg font-bold text-v2-heading">Choose Compensation Type</h3>
        <p className="mt-1 text-sm text-v2-muted">
          {"Select how you'd like to compensate "}
          <span className="font-medium text-v2-heading">{teamMemberName}</span>
        </p>
      </div>
      <div className="flex flex-col gap-2.5">
        {compensationOptions.map((option) => {
          const Icon = option.icon;
          const isActive = compensationType === option.value;
          return (
            <div
              key={option.value}
              role="button"
              tabIndex={0}
              onClick={() => setCompensationType(option.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setCompensationType(option.value);
                }
              }}
              className={cn(
                "cursor-pointer rounded-2xl border p-4 transition-colors outline-none",
                isActive ? "border-v2-blue bg-v2-blue-tint" : "border-v2-border bg-v2-surface hover:border-v2-blue/40 hover:bg-v2-page",
              )}
            >
              <div className="flex items-start gap-3">
                <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", option.tint)}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-heading text-sm font-semibold text-v2-heading">{option.title}</span>
                    <RadioDot active={isActive} />
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-v2-muted">{option.description}</p>
                  <div className={cn(
                    "mt-2.5 inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10.5px] font-medium",
                    isActive ? "bg-v2-blue-tint text-v2-blue" : "bg-v2-page text-v2-subtle",
                  )}>
                    <Sparkles className="h-2.5 w-2.5" />
                    Best for: {option.bestFor}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderEquityConfig = () => (
    <div className="space-y-5">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-v2-blue-tint text-v2-blue">
          <TrendingUp className="h-[18px] w-[18px]" />
        </div>
        <div>
          <h3 className="font-heading text-lg font-bold text-v2-heading">Equity Configuration</h3>
          <p className="mt-0.5 text-sm text-v2-muted">
            {"Set up the equity vesting schedule for "}
            <span className="font-medium text-v2-heading">{teamMemberName}</span>
          </p>
        </div>
      </div>

      <div className="space-y-4 rounded-2xl border border-v2-border bg-v2-page p-5">
        <div className="flex items-center gap-2">
          <div className="h-1 w-4 rounded-full bg-v2-blue" />
          <h4 className="font-heading text-sm font-semibold text-v2-heading">Basic Settings</h4>
        </div>
        <div>
          <V2Label htmlFor="equityTotal">Total Equity (%)</V2Label>
          <V2Input id="equityTotal" type="number" step="0.1" value={equityTotal} onChange={(e) => setEquityTotal(e.target.value)} placeholder="2.5" />
          <p className="mt-1 text-[11px] text-v2-subtle">Typical range: 0.5% – 5% for early team members</p>
        </div>
        <div>
          <V2Label htmlFor="vestingPeriod">Vesting Period (months)</V2Label>
          <V2Input id="vestingPeriod" type="number" value={vestingPeriod} onChange={(e) => setVestingPeriod(e.target.value)} placeholder="12" />
          <p className="mt-1 text-[11px] text-v2-subtle">Typical: 12–48 months</p>
        </div>
        <div>
          <V2Label htmlFor="vestingFrequency">Vesting Frequency</V2Label>
          <V2Select value={vestingFrequency} onChange={setVestingFrequency}>
            <option value="weekly">Weekly (based on weekly tasks)</option>
            <option value="monthly">Monthly (based on monthly performance)</option>
            <option value="quarterly">Quarterly</option>
          </V2Select>
          <p className="mt-1 text-[11px] text-v2-subtle">Monthly is most common</p>
        </div>
      </div>

      <div className="space-y-4 rounded-2xl border border-v2-border bg-v2-page p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <div className="h-1 w-4 rounded-full bg-v2-purple" />
              <h4 className="font-heading text-sm font-semibold text-v2-heading">Cliff Period</h4>
            </div>
            <p className="mt-1 text-[11px] text-v2-subtle">No vesting until cliff is reached</p>
          </div>
          <V2Checkbox id="cliffEnabled" checked={cliffEnabled} onChange={setCliffEnabled} />
        </div>
        {cliffEnabled && (
          <div className="border-t border-v2-border pt-3">
            <V2Label htmlFor="cliffPeriod">Cliff Period (months)</V2Label>
            <V2Input id="cliffPeriod" type="number" value={cliffPeriod} onChange={(e) => setCliffPeriod(e.target.value)} placeholder="3" />
            <p className="mt-1 text-[11px] text-v2-subtle">Standard is 3–6 months</p>
          </div>
        )}
      </div>

      <div className="space-y-4 rounded-2xl border border-v2-border bg-v2-page p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <div className="h-1 w-4 rounded-full bg-v2-green" />
              <h4 className="font-heading text-sm font-semibold text-v2-heading">Performance Gating</h4>
            </div>
            <p className="mt-1 text-[11px] text-v2-subtle">Tie vesting to task completion</p>
          </div>
          <V2Checkbox id="equityPerformanceGated" checked={equityPerformanceGated} onChange={setEquityPerformanceGated} />
        </div>
        {equityPerformanceGated && (
          <div className="space-y-4 border-t border-v2-border pt-3">
            <div>
              <V2Label htmlFor="equityThreshold">Performance Threshold (%)</V2Label>
              <V2Input id="equityThreshold" type="number" value={equityThreshold} onChange={(e) => setEquityThreshold(e.target.value)} placeholder="80" />
              <p className="mt-1 text-[11px] text-v2-subtle">Must complete this % of tasks to vest that period's equity</p>
            </div>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-body text-sm font-medium text-v2-heading">Enable Partial Vesting</p>
                <p className="mt-0.5 text-[11px] text-v2-subtle">Allow partial vesting below threshold</p>
              </div>
              <V2Checkbox id="equityPartialVesting" checked={equityPartialVesting} onChange={setEquityPartialVesting} />
            </div>
            {equityPartialVesting && (
              <div className="rounded-xl border border-v2-blue/20 bg-v2-blue-tint p-3">
                <p className="mb-1.5 text-[11px] font-semibold text-v2-blue-dark">Partial Vesting Scale</p>
                <p className="text-[11px] leading-relaxed text-v2-muted">
                  {equityThreshold}%+ completion = 100% vesting
                  <br />
                  60–{parseInt(equityThreshold) - 1}% = 50% vesting
                  <br />
                  Below 60% = No vesting
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  const renderFixedConfig = () => (
    <div className="space-y-5">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-v2-green-tint text-v2-green-dark">
          <DollarSign className="h-[18px] w-[18px]" />
        </div>
        <div>
          <h3 className="font-heading text-lg font-bold text-v2-heading">Fixed Payment Configuration</h3>
          <p className="mt-0.5 text-sm text-v2-muted">
            {"Set up the payment structure for "}
            <span className="font-medium text-v2-heading">{teamMemberName}</span>
          </p>
        </div>
      </div>

      <div className="space-y-4 rounded-2xl border border-v2-border bg-v2-page p-5">
        <div className="flex items-center gap-2">
          <div className="h-1 w-4 rounded-full bg-v2-green" />
          <h4 className="font-heading text-sm font-semibold text-v2-heading">Basic Settings</h4>
        </div>
        <div>
          <V2Label>Payment Type</V2Label>
          <V2Select value={fixedPaymentType} onChange={setFixedPaymentType}>
            <option value="monthly">Monthly stipend</option>
            <option value="one-time">One-time payment</option>
          </V2Select>
        </div>
        <div>
          <V2Label htmlFor="fixedAmount">Amount ($)</V2Label>
          <V2Input id="fixedAmount" type="number" value={fixedAmount} onChange={(e) => setFixedAmount(e.target.value)} placeholder="3000" />
        </div>
        <div>
          <V2Label>Payment Schedule</V2Label>
          <V2Select value={paymentDay} onChange={setPaymentDay}>
            <option value="last">Last day of month</option>
            <option value="first">First day of month</option>
            <option value="15th">15th of month</option>
          </V2Select>
        </div>
      </div>

      <div className="space-y-4 rounded-2xl border border-v2-border bg-v2-page p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <div className="h-1 w-4 rounded-full bg-v2-green" />
              <h4 className="font-heading text-sm font-semibold text-v2-heading">Performance Gating</h4>
            </div>
            <p className="mt-1 text-[11px] text-v2-subtle">Tie payment to task completion</p>
          </div>
          <V2Checkbox id="fixedPerformanceGated" checked={fixedPerformanceGated} onChange={setFixedPerformanceGated} />
        </div>
        {fixedPerformanceGated && (
          <div className="space-y-4 border-t border-v2-border pt-3">
            <div>
              <V2Label htmlFor="fixedThreshold">Performance Threshold (%)</V2Label>
              <V2Input id="fixedThreshold" type="number" value={fixedThreshold} onChange={(e) => setFixedThreshold(e.target.value)} placeholder="80" />
              <p className="mt-1 text-[11px] text-v2-subtle">Must complete this % of tasks for payment</p>
            </div>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-body text-sm font-medium text-v2-heading">Enable Partial Payments</p>
                <p className="mt-0.5 text-[11px] text-v2-subtle">Allow partial payments below threshold</p>
              </div>
              <V2Checkbox id="fixedPartialPayments" checked={fixedPartialPayments} onChange={setFixedPartialPayments} />
            </div>
            {fixedPartialPayments && (
              <div className="rounded-xl border border-v2-green/20 bg-v2-green-tint p-3">
                <p className="mb-1.5 text-[11px] font-semibold text-v2-green-dark">Partial Payment Scale</p>
                <p className="text-[11px] leading-relaxed text-v2-muted">
                  {fixedThreshold}%+ completion = 100% payment (${fixedAmount})
                  <br />
                  60–{parseInt(fixedThreshold) - 1}% = 70% payment (${(parseFloat(fixedAmount) * 0.7).toFixed(0)})
                  <br />
                  40–59% = 40% payment (${(parseFloat(fixedAmount) * 0.4).toFixed(0)})
                  <br />
                  Below 40% = No payment
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  const renderHourlyConfig = () => (
    <div className="space-y-5">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-v2-amber-tint text-v2-amber-dark">
          <Clock className="h-[18px] w-[18px]" />
        </div>
        <div>
          <h3 className="font-heading text-lg font-bold text-v2-heading">Hourly Rate Configuration</h3>
          <p className="mt-0.5 text-sm text-v2-muted">
            {"Set up the hourly payment structure for "}
            <span className="font-medium text-v2-heading">{teamMemberName}</span>
          </p>
        </div>
      </div>

      <div className="space-y-4 rounded-2xl border border-v2-border bg-v2-page p-5">
        <div className="flex items-center gap-2">
          <div className="h-1 w-4 rounded-full bg-v2-amber" />
          <h4 className="font-heading text-sm font-semibold text-v2-heading">Basic Settings</h4>
        </div>
        <div>
          <V2Label htmlFor="hourlyRate">Hourly Rate ($)</V2Label>
          <V2Input id="hourlyRate" type="number" value={hourlyRate} onChange={(e) => setHourlyRate(e.target.value)} placeholder="50" />
        </div>
        <div>
          <V2Label>Hour Tracking Method</V2Label>
          <V2Select value={hourTracking} onChange={setHourTracking}>
            <option value="self-report">Team member self-reports hours</option>
            <option value="manual-approval">Founder approves hours manually</option>
          </V2Select>
          <p className="mt-1 text-[11px] text-v2-subtle">Self-report is faster but less strict</p>
        </div>
        <div>
          <V2Label>Payment Frequency</V2Label>
          <V2Select value={paymentFrequency} onChange={setPaymentFrequency}>
            <option value="weekly">Weekly</option>
            <option value="bi-weekly">Bi-weekly</option>
            <option value="monthly">Monthly</option>
          </V2Select>
        </div>
      </div>

      <div className="space-y-4 rounded-2xl border border-v2-border bg-v2-page p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <div className="h-1 w-4 rounded-full bg-v2-purple" />
              <h4 className="font-heading text-sm font-semibold text-v2-heading">Weekly Hour Cap</h4>
            </div>
            <p className="mt-1 text-[11px] text-v2-subtle">Optional budget protection</p>
          </div>
          <V2Checkbox id="hourCap" checked={hourCap} onChange={setHourCap} />
        </div>
        {hourCap && (
          <div className="border-t border-v2-border pt-3">
            <V2Label htmlFor="maxHoursPerWeek">Maximum Hours Per Week</V2Label>
            <V2Input id="maxHoursPerWeek" type="number" value={maxHoursPerWeek} onChange={(e) => setMaxHoursPerWeek(e.target.value)} placeholder="40" />
            <p className="mt-1 text-[11px] text-v2-subtle">Payment will cap at this many hours per week</p>
          </div>
        )}
      </div>

      <div className="space-y-4 rounded-2xl border border-v2-border bg-v2-page p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <div className="h-1 w-4 rounded-full bg-v2-green" />
              <h4 className="font-heading text-sm font-semibold text-v2-heading">Performance Gating</h4>
            </div>
            <p className="mt-1 text-[11px] text-v2-subtle">Prevent hour padding</p>
          </div>
          <V2Checkbox id="hourlyPerformanceGated" checked={hourlyPerformanceGated} onChange={setHourlyPerformanceGated} />
        </div>
        {hourlyPerformanceGated && (
          <div className="border-t border-v2-border pt-3">
            <V2Label htmlFor="hourlyThreshold">Performance Threshold (%)</V2Label>
            <V2Input id="hourlyThreshold" type="number" value={hourlyThreshold} onChange={(e) => setHourlyThreshold(e.target.value)} placeholder="75" />
            <p className="mt-1 text-[11px] text-v2-subtle">Must complete this % of weekly tasks to receive payment for logged hours</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderSummary = () => {
    let compensationTitle = "";
    let equityDetails = [];
    let paymentDetails = [];

    if (compensationType === "equity" || compensationType === "equity-fixed") {
      const equityPerPeriod = parseFloat(equityTotal) / parseInt(vestingPeriod);
      compensationTitle = `${equityTotal}% Equity`;
      equityDetails = [
        { label: "Total Equity", value: `${equityTotal}%` },
        { label: "Vesting Period", value: `${vestingPeriod} months` },
        { label: "Per Period", value: `${equityPerPeriod.toFixed(3)}%/${vestingFrequency}` },
        { label: "Vesting Frequency", value: vestingFrequency.charAt(0).toUpperCase() + vestingFrequency.slice(1) },
        { label: "Cliff Period", value: cliffEnabled ? `${cliffPeriod} months` : "No cliff" },
      ];
      if (equityPerformanceGated) {
        equityDetails.push(
          { label: "Performance Threshold", value: `${equityThreshold}% task completion` },
          { label: "Partial Vesting", value: equityPartialVesting ? "Enabled" : "Disabled" },
        );
      } else {
        equityDetails.push({ label: "Performance Gating", value: "Not enabled" });
      }
    }

    if (compensationType === "fixed" || compensationType === "equity-fixed") {
      if (compensationTitle) compensationTitle += " + ";
      compensationTitle += `$${fixedAmount}${fixedPaymentType === "monthly" ? "/month" : " one-time"}`;
      paymentDetails = [
        { label: "Payment Amount", value: `$${fixedAmount}` },
        { label: "Payment Type", value: fixedPaymentType === "monthly" ? "Monthly stipend" : "One-time payment" },
        { label: "Payment Schedule", value: paymentDay === "last" ? "Last day of month" : paymentDay === "first" ? "First day of month" : "15th of month" },
      ];
      if (fixedPerformanceGated) {
        paymentDetails.push(
          { label: "Performance Threshold", value: `${fixedThreshold}% task completion` },
          { label: "Partial Payments", value: fixedPartialPayments ? "Enabled" : "Disabled" },
        );
      } else {
        paymentDetails.push({ label: "Performance Gating", value: "Not enabled" });
      }
    }
    if (compensationType === "hourly") {
      compensationTitle = `$${hourlyRate}/hour`;
      paymentDetails = [
        { label: "Hourly Rate", value: `$${hourlyRate}/hour` },
        { label: "Hour Tracking", value: hourTracking === "self-report" ? "Team member self-reports" : "Manual founder approval" },
        { label: "Payment Frequency", value: paymentFrequency.charAt(0).toUpperCase() + paymentFrequency.slice(1).replace("-", " ") },
        { label: "Weekly Hour Cap", value: hourCap ? `${maxHoursPerWeek} hours maximum` : "No cap" },
      ];
      if (hourlyPerformanceGated) {
        paymentDetails.push({ label: "Performance Threshold", value: `${hourlyThreshold}% task completion` });
      } else {
        paymentDetails.push({ label: "Performance Gating", value: "Not enabled" });
      }
    }
    if (compensationType === "unpaid") compensationTitle = "Unpaid / Volunteer";

    return (
      <div className="space-y-5">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-v2-blue-tint text-v2-blue">
            <ClipboardList className="h-[18px] w-[18px]" />
          </div>
          <div>
            <h3 className="font-heading text-lg font-bold text-v2-heading">Compensation Summary</h3>
            <p className="mt-0.5 text-sm text-v2-muted">
              {"Review the compensation package for "}
              <span className="font-medium text-v2-heading">{teamMemberName}</span>
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-v2-blue/30 bg-v2-blue-tint p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-v2-blue text-white">
              <Check className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-heading text-lg font-bold text-v2-heading">{compensationTitle}</p>
              <p className="mt-0.5 text-xs text-v2-muted">
                For <span className="font-medium text-v2-heading">{teamMemberName}</span>
              </p>
            </div>
          </div>
        </div>

        {equityDetails.length > 0 && (
          <div className="space-y-2.5">
            <div className="flex items-center gap-2">
              <div className="h-1 w-4 rounded-full bg-v2-blue" />
              <h4 className="font-heading text-sm font-semibold text-v2-heading">Equity Details</h4>
            </div>
            <div className="space-y-1 rounded-2xl border border-v2-border bg-v2-page p-4">
              {equityDetails.map((detail, idx) => (
                <div key={idx} className="flex items-center justify-between gap-3 rounded-lg px-2 py-1.5 text-sm hover:bg-white">
                  <span className="text-v2-muted">{detail.label}</span>
                  <span className="font-medium text-v2-heading">{detail.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {paymentDetails.length > 0 && compensationType !== "unpaid" && (
          <div className="space-y-2.5">
            <div className="flex items-center gap-2">
              <div className="h-1 w-4 rounded-full bg-v2-green" />
              <h4 className="font-heading text-sm font-semibold text-v2-heading">Payment Details</h4>
            </div>
            <div className="space-y-1 rounded-2xl border border-v2-border bg-v2-page p-4">
              {paymentDetails.map((detail, idx) => (
                <div key={idx} className="flex items-center justify-between gap-3 rounded-lg px-2 py-1.5 text-sm hover:bg-white">
                  <span className="text-v2-muted">{detail.label}</span>
                  <span className="font-medium text-v2-heading">{detail.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {compensationType === "unpaid" && (
          <div className="rounded-2xl border border-v2-border bg-v2-page p-4">
            <p className="text-sm text-v2-muted">
              <span className="font-medium text-v2-heading">{teamMemberName}</span>
              {" will participate as an unpaid volunteer or co-founder with no immediate monetary compensation."}
            </p>
          </div>
        )}

        {(equityPerformanceGated || fixedPerformanceGated || hourlyPerformanceGated) && (
          <div className="rounded-2xl border border-v2-blue/20 bg-v2-blue-tint p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-v2-blue">
                <TrendingUp className="h-4 w-4" />
              </div>
              <div className="min-w-0 space-y-1">
                <p className="font-heading text-sm font-semibold text-v2-heading">Performance-Based Compensation</p>
                <p className="text-[11px] leading-relaxed text-v2-muted">
                  {"Compensation is tied to task completion rates. "}
                  <span className="font-medium text-v2-heading">{teamMemberName}</span>
                  {" can track their performance in real-time and see exactly what they need to complete to unlock their compensation each period."}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="rounded-2xl border border-v2-purple/20 bg-v2-purple-tint p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-v2-purple">
              <Info className="h-4 w-4" />
            </div>
            <div className="min-w-0 space-y-2">
              <p className="font-heading text-sm font-semibold text-v2-heading">Team Member Dashboard</p>
              <p className="text-[11px] text-v2-muted">
                <span className="font-medium text-v2-heading">{teamMemberName}</span>{" will see:"}
              </p>
              <ul className="space-y-1 text-[11px] leading-relaxed text-v2-muted">
                <li className="flex items-start gap-2">
                  <Check className="mt-0.5 h-3 w-3 shrink-0 text-v2-purple" />
                  <span>Current task completion percentage</span>
                </li>
                {(equityPerformanceGated || fixedPerformanceGated || hourlyPerformanceGated) && (
                  <li className="flex items-start gap-2">
                    <Check className="mt-0.5 h-3 w-3 shrink-0 text-v2-purple" />
                    <span>Performance threshold and eligibility status</span>
                  </li>
                )}
                {(compensationType === "equity" || compensationType === "equity-fixed") && (
                  <li className="flex items-start gap-2">
                    <Check className="mt-0.5 h-3 w-3 shrink-0 text-v2-purple" />
                    <span>Equity vesting progress and timeline</span>
                  </li>
                )}
                {compensationType !== "unpaid" && compensationType !== "equity" && (
                  <li className="flex items-start gap-2">
                    <Check className="mt-0.5 h-3 w-3 shrink-0 text-v2-purple" />
                    <span>Payment eligibility and next payment date</span>
                  </li>
                )}
              </ul>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-v2-amber/30 bg-v2-amber-tint p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-v2-amber-dark">
              <AlertCircle className="h-4 w-4" />
            </div>
            <div className="min-w-0 space-y-1">
              <p className="font-heading text-sm font-semibold text-v2-heading">Compensation Contract</p>
              <p className="text-[11px] leading-relaxed text-v2-muted">
                {"This contract will be visible to "}
                <span className="font-medium text-v2-heading">{teamMemberName}</span>
                {" and tracked automatically based on weekly task completion. You can modify this contract anytime from the Team page."}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const stepLabels = compensationType === "equity-fixed"
    ? ["Type", "Equity", "Payment", "Summary"]
    : ["Type", "Configure", "Summary"];
  const stepIcons = [Settings2, TrendingUp, ClipboardList];
  const equityFixedIcons = [Settings2, TrendingUp, DollarSign, ClipboardList];
  const iconsForSteps = compensationType === "equity-fixed" ? equityFixedIcons : stepIcons;
  const isFinalStep = step === totalSteps || (step === 2 && compensationType === "unpaid");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[95] flex items-center justify-center bg-black/35 p-4" onClick={onClose}>
      <div
        className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="shrink-0 border-b border-v2-border bg-v2-page px-6 pb-5 pt-6 text-left">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-v2-blue text-white">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-heading text-lg font-bold text-v2-heading">Team Onboarding &amp; Compensation</p>
              <p className="mt-0.5 text-sm text-v2-muted">
                Setting up <span className="font-medium text-v2-heading">{teamMemberName}</span>{" "}
                <span className="text-v2-subtle">• Step {step} of {totalSteps}</span>
              </p>
            </div>
          </div>

          <div className="mt-5 flex items-center gap-1.5" aria-label={`Step ${step} of ${totalSteps}`}>
            {stepLabels.map((label, idx) => {
              const stepNumber = idx + 1;
              const isActive = step === stepNumber;
              const isCompleted = step > stepNumber;
              const StepIcon = iconsForSteps[idx] || ClipboardList;
              return (
                <React.Fragment key={label}>
                  <div className="flex min-w-0 flex-1 items-center gap-2">
                    <div
                      className={cn(
                        "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold transition-colors",
                        isCompleted ? "bg-v2-blue text-white" : isActive ? "bg-v2-blue-tint text-v2-blue ring-2 ring-v2-blue/30" : "bg-white text-v2-subtle ring-1 ring-v2-border",
                      )}
                    >
                      {isCompleted ? <Check className="h-3.5 w-3.5" /> : <StepIcon className="h-3.5 w-3.5" />}
                    </div>
                    <span className={cn(
                      "hidden truncate text-[11px] font-medium transition-colors sm:inline",
                      isActive ? "text-v2-heading" : isCompleted ? "text-v2-blue" : "text-v2-subtle",
                    )}>
                      {label}
                    </span>
                  </div>
                  {idx < stepLabels.length - 1 && (
                    <div className={cn("h-0.5 flex-1 rounded-full transition-colors", isCompleted ? "bg-v2-blue" : "bg-v2-border")} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          {step === 1 && renderStep1()}
          {step === 2 && compensationType === "equity" && renderEquityConfig()}
          {step === 2 && compensationType === "fixed" && renderFixedConfig()}
          {step === 2 && compensationType === "hourly" && renderHourlyConfig()}
          {step === 2 && compensationType === "equity-fixed" && renderEquityConfig()}
          {step === 3 && compensationType === "equity-fixed" && renderFixedConfig()}
          {step === totalSteps && compensationType !== "unpaid" && renderSummary()}
          {step === 2 && compensationType === "unpaid" && renderSummary()}
        </div>

        <div className="flex shrink-0 items-center justify-between gap-2 border-t border-v2-border bg-v2-page px-6 py-4">
          <V2Btn variant="secondary" size="lg" onClick={handleBack} disabled={step === 1}>
            <ArrowLeft className="h-4 w-4" /> Back
          </V2Btn>
          <div className="hidden font-body text-[11px] text-v2-subtle sm:block">
            Step <span className="font-semibold text-v2-heading">{step}</span> of <span className="font-semibold text-v2-heading">{totalSteps}</span>
          </div>
          <button
            type="button"
            onClick={handleNext}
            className={cn(
              "inline-flex items-center justify-center gap-1.5 rounded-full px-[18px] py-[8px] font-body text-[13px] font-semibold text-white transition-colors",
              isFinalStep ? "bg-v2-green hover:bg-v2-green-dark" : "bg-v2-blue hover:bg-v2-blue-dark",
            )}
          >
            {isFinalStep ? (<><Check className="h-4 w-4" /> Complete Setup</>) : (<>Next <ChevronRight className="h-4 w-4" /></>)}
          </button>
        </div>
      </div>
    </div>
  );
}
