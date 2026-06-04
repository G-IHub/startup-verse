import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Checkbox } from "../ui/checkbox";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
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
export default function CompensationSetupWizard({
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
    {
      minCompletion: 60,
      maxCompletion: 79,
      vestingPercentage: 50,
    },
  ]);

  // Fixed payment configuration
  const [fixedPaymentType, setFixedPaymentType] = useState("monthly");
  const [fixedAmount, setFixedAmount] = useState("3000");
  const [fixedPerformanceGated, setFixedPerformanceGated] = useState(true);
  const [fixedThreshold, setFixedThreshold] = useState("80");
  const [fixedPartialPayments, setFixedPartialPayments] = useState(true);
  const [fixedPartialScale, setFixedPartialScale] = useState([
    {
      minCompletion: 60,
      maxCompletion: 79,
      paymentPercentage: 70,
    },
    {
      minCompletion: 40,
      maxCompletion: 59,
      paymentPercentage: 40,
    },
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
    // Validation
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
    if (step > 1) {
      setStep(step - 1);
    }
  };
  const handleComplete = () => {
    console.log("🎯 handleComplete called - Building config...");

    // Build compensation config object
    const config = {
      type: compensationType,
    };
    if (compensationType === "equity" || compensationType === "equity-fixed") {
      config.equity = {
        totalEquity: equityTotal,
        vestingPeriod: vestingPeriod,
        cliffEnabled: cliffEnabled,
        cliffPeriod: cliffPeriod,
        vestingFrequency: vestingFrequency,
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
        paymentDay: paymentDay,
      };
    }
    if (compensationType === "hourly") {
      config.hourly = {
        rate: hourlyRate,
        tracking: hourTracking,
        performanceGated: hourlyPerformanceGated,
        threshold: hourlyThreshold,
        hourCap: hourCap,
        maxHoursPerWeek: maxHoursPerWeek,
        paymentFrequency: paymentFrequency,
      };
    }
    if (compensationType === "unpaid") {
      config.unpaid = true;
    }
    console.log("✅ Config built:", config);
    console.log("🚀 Calling onComplete...");
    onComplete(config);
  };
  const compensationOptions = [
    {
      value: "equity",
      title: "Equity Only",
      description: "Offer equity compensation with a vesting schedule",
      bestFor: "Early team, high risk / high reward",
      icon: TrendingUp,
      accent: "from-primary/10 to-accent/10 text-primary",
    },
    {
      value: "fixed",
      title: "Fixed Payment",
      description: "Monthly stipend or one-time payment",
      bestFor: "Contractors, specific roles",
      icon: DollarSign,
      accent: "from-emerald-500/10 to-emerald-500/5 text-emerald-600",
    },
    {
      value: "hourly",
      title: "Hourly Rate",
      description: "Pay by the hour worked",
      bestFor: "Part-time, flexible roles",
      icon: Clock,
      accent: "from-amber-500/10 to-amber-500/5 text-amber-600",
    },
    {
      value: "equity-fixed",
      title: "Equity + Fixed Payment",
      description: "Combine equity with cash compensation",
      bestFor: "Key hires who need income",
      icon: Layers,
      accent: "from-accent/10 to-primary/10 text-accent",
    },
    {
      value: "unpaid",
      title: "Unpaid / Volunteer",
      description: "No immediate monetary compensation",
      bestFor: "Co-founders, interns",
      icon: HeartHandshake,
      accent: "from-rose-500/10 to-rose-500/5 text-rose-500",
    },
  ];

  const renderStep1 = () => (
    <div className="space-y-5">
      <div>
        <h3 className="font-heading text-lg font-bold text-text-heading">
          Choose Compensation Type
        </h3>
        <p className="mt-1 text-sm text-text-body">
          {"Select how you'd like to compensate "}
          <span className="font-medium text-text-heading">
            {teamMemberName}
          </span>
        </p>
      </div>
      <RadioGroup
        value={compensationType}
        onValueChange={setCompensationType}
        className="gap-2.5"
      >
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
              className={`group relative cursor-pointer rounded-2xl border p-4 transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-primary/30 ${
                isActive
                  ? "border-primary bg-primary/[0.04] shadow-[0_4px_18px_-8px_rgba(58,90,254,0.25)]"
                  : "border-surface-border bg-surface-card hover:border-primary/40 hover:bg-surface-page/40"
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ring-1 transition-colors ${option.accent} ${
                    isActive
                      ? "ring-primary/20"
                      : "ring-surface-border group-hover:ring-primary/20"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <Label
                      htmlFor={option.value}
                      className="cursor-pointer font-heading text-sm font-semibold text-text-heading"
                    >
                      {option.title}
                    </Label>
                    <RadioGroupItem
                      value={option.value}
                      id={option.value}
                      className={`h-4 w-4 flex-shrink-0 transition-colors ${
                        isActive ? "border-primary" : ""
                      }`}
                    />
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-text-body">
                    {option.description}
                  </p>
                  <div
                    className={`mt-2.5 inline-flex items-center gap-1.5 rounded-pill px-2 py-0.5 text-[10.5px] font-medium transition-colors ${
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "bg-surface-page text-text-muted"
                    }`}
                  >
                    <Sparkles className="h-2.5 w-2.5" />
                    Best for: {option.bestFor}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </RadioGroup>
    </div>
  );
  const renderEquityConfig = () => (
    <div className="space-y-5">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/15 to-accent/15 text-primary ring-1 ring-primary/15">
          <TrendingUp className="h-4.5 w-4.5" />
        </div>
        <div>
          <h3 className="font-heading text-lg font-bold text-text-heading">
            Equity Configuration
          </h3>
          <p className="mt-0.5 text-sm text-text-body">
            {"Set up the equity vesting schedule for "}
            <span className="font-medium text-text-heading">
              {teamMemberName}
            </span>
          </p>
        </div>
      </div>
      <div className="space-y-4 rounded-2xl border border-surface-border bg-surface-page/40 p-5">
        <div className="flex items-center gap-2">
          <div className="h-1 w-4 rounded-full bg-primary" />
          <h4 className="font-heading text-sm font-semibold text-text-heading">
            Basic Settings
          </h4>
        </div>
        <div className="space-y-1.5">
          <Label
            htmlFor="equityTotal"
            className="text-xs font-medium text-text-body"
          >
            Total Equity (%)
          </Label>
          <Input
            id="equityTotal"
            type="number"
            step="0.1"
            value={equityTotal}
            onChange={(e) => setEquityTotal(e.target.value)}
            placeholder="2.5"
          />
          <p className="text-[11px] text-text-muted">
            Typical range: 0.5% – 5% for early team members
          </p>
        </div>
        <div className="space-y-1.5">
          <Label
            htmlFor="vestingPeriod"
            className="text-xs font-medium text-text-body"
          >
            Vesting Period (months)
          </Label>
          <Input
            id="vestingPeriod"
            type="number"
            value={vestingPeriod}
            onChange={(e) => setVestingPeriod(e.target.value)}
            placeholder="12"
          />
          <p className="text-[11px] text-text-muted">Typical: 12–48 months</p>
        </div>
        <div className="space-y-1.5">
          <Label
            htmlFor="vestingFrequency"
            className="text-xs font-medium text-text-body"
          >
            Vesting Frequency
          </Label>
          <Select
            value={vestingFrequency}
            onValueChange={(value) => setVestingFrequency(value)}
          >
            <SelectTrigger id="vestingFrequency">
              <SelectValue placeholder="Select frequency" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="weekly">
                Weekly (based on weekly tasks)
              </SelectItem>
              <SelectItem value="monthly">
                Monthly (based on monthly performance)
              </SelectItem>
              <SelectItem value="quarterly">Quarterly</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-[11px] text-text-muted">Monthly is most common</p>
        </div>
      </div>
      <div className="space-y-4 rounded-2xl border border-surface-border bg-surface-page/40 p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <div className="h-1 w-4 rounded-full bg-accent" />
              <h4 className="font-heading text-sm font-semibold text-text-heading">
                Cliff Period
              </h4>
            </div>
            <p className="mt-1 text-[11px] text-text-muted">
              No vesting until cliff is reached
            </p>
          </div>
          <Checkbox
            id="cliffEnabled"
            checked={cliffEnabled}
            onCheckedChange={(checked) => setCliffEnabled(checked)}
          />
        </div>
        {cliffEnabled && (
          <div className="space-y-1.5 border-t border-surface-border/70 pt-3">
            <Label
              htmlFor="cliffPeriod"
              className="text-xs font-medium text-text-body"
            >
              Cliff Period (months)
            </Label>
            <Input
              id="cliffPeriod"
              type="number"
              value={cliffPeriod}
              onChange={(e) => setCliffPeriod(e.target.value)}
              placeholder="3"
            />
            <p className="text-[11px] text-text-muted">Standard is 3–6 months</p>
          </div>
        )}
      </div>
      <div className="space-y-4 rounded-2xl border border-surface-border bg-surface-page/40 p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <div className="h-1 w-4 rounded-full bg-status-success" />
              <h4 className="font-heading text-sm font-semibold text-text-heading">
                Performance Gating
              </h4>
            </div>
            <p className="mt-1 text-[11px] text-text-muted">
              Tie vesting to task completion
            </p>
          </div>
          <Checkbox
            id="equityPerformanceGated"
            checked={equityPerformanceGated}
            onCheckedChange={(checked) => setEquityPerformanceGated(checked)}
          />
        </div>
        {equityPerformanceGated && (
          <div className="space-y-4 border-t border-surface-border/70 pt-3">
            <div className="space-y-1.5">
              <Label
                htmlFor="equityThreshold"
                className="text-xs font-medium text-text-body"
              >
                Performance Threshold (%)
              </Label>
              <Input
                id="equityThreshold"
                type="number"
                value={equityThreshold}
                onChange={(e) => setEquityThreshold(e.target.value)}
                placeholder="80"
              />
              <p className="text-[11px] text-text-muted">
                Must complete this % of tasks to vest that period's equity
              </p>
            </div>
            <div className="flex items-start justify-between gap-3">
              <div>
                <Label className="text-sm font-medium text-text-heading">
                  Enable Partial Vesting
                </Label>
                <p className="mt-0.5 text-[11px] text-text-muted">
                  Allow partial vesting below threshold
                </p>
              </div>
              <Checkbox
                id="equityPartialVesting"
                checked={equityPartialVesting}
                onCheckedChange={(checked) => setEquityPartialVesting(checked)}
              />
            </div>
            {equityPartialVesting && (
              <div className="rounded-xl border border-primary/15 bg-primary/[0.04] p-3">
                <p className="mb-1.5 text-[11px] font-semibold text-primary">
                  Partial Vesting Scale
                </p>
                <p className="text-[11px] leading-relaxed text-text-body">
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
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/15 to-emerald-500/5 text-emerald-600 ring-1 ring-emerald-500/15">
          <DollarSign className="h-4.5 w-4.5" />
        </div>
        <div>
          <h3 className="font-heading text-lg font-bold text-text-heading">
            Fixed Payment Configuration
          </h3>
          <p className="mt-0.5 text-sm text-text-body">
            {"Set up the payment structure for "}
            <span className="font-medium text-text-heading">
              {teamMemberName}
            </span>
          </p>
        </div>
      </div>
      <div className="space-y-4 rounded-2xl border border-surface-border bg-surface-page/40 p-5">
        <div className="flex items-center gap-2">
          <div className="h-1 w-4 rounded-full bg-emerald-500" />
          <h4 className="font-heading text-sm font-semibold text-text-heading">
            Basic Settings
          </h4>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-text-body">
            Payment Type
          </Label>
          <Select
            value={fixedPaymentType}
            onValueChange={(value) => setFixedPaymentType(value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select payment type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="monthly">Monthly stipend</SelectItem>
              <SelectItem value="one-time">One-time payment</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label
            htmlFor="fixedAmount"
            className="text-xs font-medium text-text-body"
          >
            Amount ($)
          </Label>
          <Input
            id="fixedAmount"
            type="number"
            value={fixedAmount}
            onChange={(e) => setFixedAmount(e.target.value)}
            placeholder="3000"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-text-body">
            Payment Schedule
          </Label>
          <Select value={paymentDay} onValueChange={setPaymentDay}>
            <SelectTrigger>
              <SelectValue placeholder="Select payment day" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="last">Last day of month</SelectItem>
              <SelectItem value="first">First day of month</SelectItem>
              <SelectItem value="15th">15th of month</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-4 rounded-2xl border border-surface-border bg-surface-page/40 p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <div className="h-1 w-4 rounded-full bg-status-success" />
              <h4 className="font-heading text-sm font-semibold text-text-heading">
                Performance Gating
              </h4>
            </div>
            <p className="mt-1 text-[11px] text-text-muted">
              Tie payment to task completion
            </p>
          </div>
          <Checkbox
            id="fixedPerformanceGated"
            checked={fixedPerformanceGated}
            onCheckedChange={(checked) => setFixedPerformanceGated(checked)}
          />
        </div>
        {fixedPerformanceGated && (
          <div className="space-y-4 border-t border-surface-border/70 pt-3">
            <div className="space-y-1.5">
              <Label
                htmlFor="fixedThreshold"
                className="text-xs font-medium text-text-body"
              >
                Performance Threshold (%)
              </Label>
              <Input
                id="fixedThreshold"
                type="number"
                value={fixedThreshold}
                onChange={(e) => setFixedThreshold(e.target.value)}
                placeholder="80"
              />
              <p className="text-[11px] text-text-muted">
                Must complete this % of tasks for payment
              </p>
            </div>
            <div className="flex items-start justify-between gap-3">
              <div>
                <Label className="text-sm font-medium text-text-heading">
                  Enable Partial Payments
                </Label>
                <p className="mt-0.5 text-[11px] text-text-muted">
                  Allow partial payments below threshold
                </p>
              </div>
              <Checkbox
                id="fixedPartialPayments"
                checked={fixedPartialPayments}
                onCheckedChange={(checked) => setFixedPartialPayments(checked)}
              />
            </div>
            {fixedPartialPayments && (
              <div className="rounded-xl border border-emerald-500/15 bg-emerald-500/[0.05] p-3">
                <p className="mb-1.5 text-[11px] font-semibold text-emerald-700">
                  Partial Payment Scale
                </p>
                <p className="text-[11px] leading-relaxed text-text-body">
                  {fixedThreshold}%+ completion = 100% payment (${fixedAmount})
                  <br />
                  60–{parseInt(fixedThreshold) - 1}% = 70% payment ($
                  {(parseFloat(fixedAmount) * 0.7).toFixed(0)})
                  <br />
                  40–59% = 40% payment ($
                  {(parseFloat(fixedAmount) * 0.4).toFixed(0)})
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
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500/15 to-amber-500/5 text-amber-600 ring-1 ring-amber-500/15">
          <Clock className="h-4.5 w-4.5" />
        </div>
        <div>
          <h3 className="font-heading text-lg font-bold text-text-heading">
            Hourly Rate Configuration
          </h3>
          <p className="mt-0.5 text-sm text-text-body">
            {"Set up the hourly payment structure for "}
            <span className="font-medium text-text-heading">
              {teamMemberName}
            </span>
          </p>
        </div>
      </div>
      <div className="space-y-4 rounded-2xl border border-surface-border bg-surface-page/40 p-5">
        <div className="flex items-center gap-2">
          <div className="h-1 w-4 rounded-full bg-amber-500" />
          <h4 className="font-heading text-sm font-semibold text-text-heading">
            Basic Settings
          </h4>
        </div>
        <div className="space-y-1.5">
          <Label
            htmlFor="hourlyRate"
            className="text-xs font-medium text-text-body"
          >
            Hourly Rate ($)
          </Label>
          <Input
            id="hourlyRate"
            type="number"
            value={hourlyRate}
            onChange={(e) => setHourlyRate(e.target.value)}
            placeholder="50"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-text-body">
            Hour Tracking Method
          </Label>
          <Select
            value={hourTracking}
            onValueChange={(value) => setHourTracking(value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select tracking method" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="self-report">
                Team member self-reports hours
              </SelectItem>
              <SelectItem value="manual-approval">
                Founder approves hours manually
              </SelectItem>
            </SelectContent>
          </Select>
          <p className="text-[11px] text-text-muted">
            Self-report is faster but less strict
          </p>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-text-body">
            Payment Frequency
          </Label>
          <Select
            value={paymentFrequency}
            onValueChange={(value) => setPaymentFrequency(value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select frequency" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="bi-weekly">Bi-weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-4 rounded-2xl border border-surface-border bg-surface-page/40 p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <div className="h-1 w-4 rounded-full bg-accent" />
              <h4 className="font-heading text-sm font-semibold text-text-heading">
                Weekly Hour Cap
              </h4>
            </div>
            <p className="mt-1 text-[11px] text-text-muted">
              Optional budget protection
            </p>
          </div>
          <Checkbox
            id="hourCap"
            checked={hourCap}
            onCheckedChange={(checked) => setHourCap(checked)}
          />
        </div>
        {hourCap && (
          <div className="space-y-1.5 border-t border-surface-border/70 pt-3">
            <Label
              htmlFor="maxHoursPerWeek"
              className="text-xs font-medium text-text-body"
            >
              Maximum Hours Per Week
            </Label>
            <Input
              id="maxHoursPerWeek"
              type="number"
              value={maxHoursPerWeek}
              onChange={(e) => setMaxHoursPerWeek(e.target.value)}
              placeholder="40"
            />
            <p className="text-[11px] text-text-muted">
              Payment will cap at this many hours per week
            </p>
          </div>
        )}
      </div>
      <div className="space-y-4 rounded-2xl border border-surface-border bg-surface-page/40 p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <div className="h-1 w-4 rounded-full bg-status-success" />
              <h4 className="font-heading text-sm font-semibold text-text-heading">
                Performance Gating
              </h4>
            </div>
            <p className="mt-1 text-[11px] text-text-muted">
              Prevent hour padding
            </p>
          </div>
          <Checkbox
            id="hourlyPerformanceGated"
            checked={hourlyPerformanceGated}
            onCheckedChange={(checked) => setHourlyPerformanceGated(checked)}
          />
        </div>
        {hourlyPerformanceGated && (
          <div className="space-y-1.5 border-t border-surface-border/70 pt-3">
            <Label
              htmlFor="hourlyThreshold"
              className="text-xs font-medium text-text-body"
            >
              Performance Threshold (%)
            </Label>
            <Input
              id="hourlyThreshold"
              type="number"
              value={hourlyThreshold}
              onChange={(e) => setHourlyThreshold(e.target.value)}
              placeholder="75"
            />
            <p className="text-[11px] text-text-muted">
              Must complete this % of weekly tasks to receive payment for logged
              hours
            </p>
          </div>
        )}
      </div>
    </div>
  );
  const renderSummary = () => {
    let compensationTitle = "";
    let equityDetails = [];
    let paymentDetails = [];

    // Build equity details
    if (compensationType === "equity" || compensationType === "equity-fixed") {
      const equityPerPeriod = parseFloat(equityTotal) / parseInt(vestingPeriod);
      compensationTitle = `${equityTotal}% Equity`;
      equityDetails = [
        {
          label: "Total Equity",
          value: `${equityTotal}%`,
        },
        {
          label: "Vesting Period",
          value: `${vestingPeriod} months`,
        },
        {
          label: "Per Period",
          value: `${equityPerPeriod.toFixed(3)}%/${vestingFrequency}`,
        },
        {
          label: "Vesting Frequency",
          value:
            vestingFrequency.charAt(0).toUpperCase() +
            vestingFrequency.slice(1),
        },
        {
          label: "Cliff Period",
          value: cliffEnabled ? `${cliffPeriod} months` : "No cliff",
        },
      ];
      if (equityPerformanceGated) {
        equityDetails.push(
          {
            label: "Performance Threshold",
            value: `${equityThreshold}% task completion`,
          },
          {
            label: "Partial Vesting",
            value: equityPartialVesting ? "Enabled" : "Disabled",
          },
        );
      } else {
        equityDetails.push({
          label: "Performance Gating",
          value: "Not enabled",
        });
      }
    }

    // Build payment details
    if (compensationType === "fixed" || compensationType === "equity-fixed") {
      if (compensationTitle) compensationTitle += " + ";
      compensationTitle += `$${fixedAmount}${fixedPaymentType === "monthly" ? "/month" : " one-time"}`;
      paymentDetails = [
        {
          label: "Payment Amount",
          value: `$${fixedAmount}`,
        },
        {
          label: "Payment Type",
          value:
            fixedPaymentType === "monthly"
              ? "Monthly stipend"
              : "One-time payment",
        },
        {
          label: "Payment Schedule",
          value:
            paymentDay === "last"
              ? "Last day of month"
              : paymentDay === "first"
                ? "First day of month"
                : "15th of month",
        },
      ];
      if (fixedPerformanceGated) {
        paymentDetails.push(
          {
            label: "Performance Threshold",
            value: `${fixedThreshold}% task completion`,
          },
          {
            label: "Partial Payments",
            value: fixedPartialPayments ? "Enabled" : "Disabled",
          },
        );
      } else {
        paymentDetails.push({
          label: "Performance Gating",
          value: "Not enabled",
        });
      }
    }
    if (compensationType === "hourly") {
      compensationTitle = `$${hourlyRate}/hour`;
      paymentDetails = [
        {
          label: "Hourly Rate",
          value: `$${hourlyRate}/hour`,
        },
        {
          label: "Hour Tracking",
          value:
            hourTracking === "self-report"
              ? "Team member self-reports"
              : "Manual founder approval",
        },
        {
          label: "Payment Frequency",
          value:
            paymentFrequency.charAt(0).toUpperCase() +
            paymentFrequency.slice(1).replace("-", " "),
        },
        {
          label: "Weekly Hour Cap",
          value: hourCap ? `${maxHoursPerWeek} hours maximum` : "No cap",
        },
      ];
      if (hourlyPerformanceGated) {
        paymentDetails.push({
          label: "Performance Threshold",
          value: `${hourlyThreshold}% task completion`,
        });
      } else {
        paymentDetails.push({
          label: "Performance Gating",
          value: "Not enabled",
        });
      }
    }
    if (compensationType === "unpaid") {
      compensationTitle = "Unpaid / Volunteer";
    }
    return (
      <div className="space-y-5">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/15 to-accent/15 text-primary ring-1 ring-primary/15">
            <ClipboardList className="h-4.5 w-4.5" />
          </div>
          <div>
            <h3 className="font-heading text-lg font-bold text-text-heading">
              Compensation Summary
            </h3>
            <p className="mt-0.5 text-sm text-text-body">
              {"Review the compensation package for "}
              <span className="font-medium text-text-heading">
                {teamMemberName}
              </span>
            </p>
          </div>
        </div>
        <div className="relative overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/[0.06] via-primary/[0.04] to-accent/[0.04] p-5 shadow-[0_4px_20px_-10px_rgba(58,90,254,0.25)]">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-10 -right-10 h-32 w-32 rounded-full bg-primary/10 blur-3xl"
          />
          <div className="relative flex items-start gap-3">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-primary text-white shadow-sm">
              <Check className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-heading text-lg font-bold text-text-heading">
                {compensationTitle}
              </p>
              <p className="mt-0.5 text-xs text-text-body">
                For{" "}
                <span className="font-medium text-text-heading">
                  {teamMemberName}
                </span>
              </p>
            </div>
          </div>
        </div>
        {equityDetails.length > 0 && (
          <div className="space-y-2.5">
            <div className="flex items-center gap-2">
              <div className="h-1 w-4 rounded-full bg-primary" />
              <h4 className="font-heading text-sm font-semibold text-text-heading">
                Equity Details
              </h4>
            </div>
            <div className="space-y-1 rounded-2xl border border-surface-border bg-surface-page/40 p-4">
              {equityDetails.map((detail, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between gap-3 rounded-lg px-2 py-1.5 text-sm hover:bg-surface-card/60"
                >
                  <span className="text-text-muted">{detail.label}</span>
                  <span className="font-medium text-text-heading">
                    {detail.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
        {paymentDetails.length > 0 && compensationType !== "unpaid" && (
          <div className="space-y-2.5">
            <div className="flex items-center gap-2">
              <div className="h-1 w-4 rounded-full bg-emerald-500" />
              <h4 className="font-heading text-sm font-semibold text-text-heading">
                Payment Details
              </h4>
            </div>
            <div className="space-y-1 rounded-2xl border border-surface-border bg-surface-page/40 p-4">
              {paymentDetails.map((detail, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between gap-3 rounded-lg px-2 py-1.5 text-sm hover:bg-surface-card/60"
                >
                  <span className="text-text-muted">{detail.label}</span>
                  <span className="font-medium text-text-heading">
                    {detail.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
        {compensationType === "unpaid" && (
          <div className="rounded-2xl border border-surface-border bg-surface-page/40 p-4">
            <p className="text-sm text-text-body">
              <span className="font-medium text-text-heading">
                {teamMemberName}
              </span>
              {
                " will participate as an unpaid volunteer or co-founder with no immediate monetary compensation."
              }
            </p>
          </div>
        )}
        {(equityPerformanceGated ||
          fixedPerformanceGated ||
          hourlyPerformanceGated) && (
          <div className="rounded-2xl border border-primary/15 bg-primary/[0.04] p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/20">
                <TrendingUp className="h-4 w-4" />
              </div>
              <div className="min-w-0 space-y-1">
                <p className="font-heading text-sm font-semibold text-text-heading">
                  Performance-Based Compensation
                </p>
                <p className="text-[11px] leading-relaxed text-text-body">
                  {"Compensation is tied to task completion rates. "}
                  <span className="font-medium text-text-heading">
                    {teamMemberName}
                  </span>
                  {
                    " can track their performance in real-time and see exactly what they need to complete to unlock their compensation each period."
                  }
                </p>
              </div>
            </div>
          </div>
        )}
        <div className="rounded-2xl border border-accent/15 bg-accent/[0.04] p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent ring-1 ring-accent/20">
              <Info className="h-4 w-4" />
            </div>
            <div className="min-w-0 space-y-2">
              <p className="font-heading text-sm font-semibold text-text-heading">
                Team Member Dashboard
              </p>
              <p className="text-[11px] text-text-body">
                <span className="font-medium text-text-heading">
                  {teamMemberName}
                </span>
                {" will see:"}
              </p>
              <ul className="space-y-1 text-[11px] leading-relaxed text-text-body">
                <li className="flex items-start gap-2">
                  <Check className="mt-0.5 h-3 w-3 flex-shrink-0 text-accent" />
                  <span>Current task completion percentage</span>
                </li>
                {(equityPerformanceGated ||
                  fixedPerformanceGated ||
                  hourlyPerformanceGated) && (
                  <li className="flex items-start gap-2">
                    <Check className="mt-0.5 h-3 w-3 flex-shrink-0 text-accent" />
                    <span>Performance threshold and eligibility status</span>
                  </li>
                )}
                {(compensationType === "equity" ||
                  compensationType === "equity-fixed") && (
                  <li className="flex items-start gap-2">
                    <Check className="mt-0.5 h-3 w-3 flex-shrink-0 text-accent" />
                    <span>Equity vesting progress and timeline</span>
                  </li>
                )}
                {compensationType !== "unpaid" &&
                  compensationType !== "equity" && (
                    <li className="flex items-start gap-2">
                      <Check className="mt-0.5 h-3 w-3 flex-shrink-0 text-accent" />
                      <span>Payment eligibility and next payment date</span>
                    </li>
                  )}
              </ul>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-amber-500/20 bg-amber-50/60 p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 ring-1 ring-amber-500/20">
              <AlertCircle className="h-4 w-4" />
            </div>
            <div className="min-w-0 space-y-1">
              <p className="font-heading text-sm font-semibold text-text-heading">
                Compensation Contract
              </p>
              <p className="text-[11px] leading-relaxed text-text-body">
                {"This contract will be visible to "}
                <span className="font-medium text-text-heading">
                  {teamMemberName}
                </span>
                {
                  " and tracked automatically based on weekly task completion. You can modify this contract anytime from the Team page."
                }
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };
  const stepLabels =
    compensationType === "equity-fixed"
      ? ["Type", "Equity", "Payment", "Summary"]
      : ["Type", "Configure", "Summary"];
  const stepIcons = [Settings2, TrendingUp, ClipboardList];
  const equityFixedIcons = [Settings2, TrendingUp, DollarSign, ClipboardList];
  const iconsForSteps =
    compensationType === "equity-fixed" ? equityFixedIcons : stepIcons;
  const isFinalStep =
    step === totalSteps || (step === 2 && compensationType === "unpaid");

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto p-0 sm:max-w-2xl">
        <DialogHeader className="border-b border-surface-border bg-gradient-to-br from-surface-page/40 to-surface-card px-6 pt-6 pb-5 text-left">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent text-white shadow-sm">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <DialogTitle className="font-heading text-lg font-bold text-text-heading">
                Team Onboarding & Compensation
              </DialogTitle>
              <DialogDescription className="mt-0.5 text-sm text-text-body">
                Setting up{" "}
                <span className="font-medium text-text-heading">
                  {teamMemberName}
                </span>{" "}
                <span className="text-text-muted">
                  • Step {step} of {totalSteps}
                </span>
              </DialogDescription>
            </div>
          </div>
          <div
            className="mt-5 flex items-center gap-1.5"
            aria-label={`Step ${step} of ${totalSteps}`}
          >
            {stepLabels.map((label, idx) => {
              const stepNumber = idx + 1;
              const isActive = step === stepNumber;
              const isCompleted = step > stepNumber;
              const StepIcon = iconsForSteps[idx] || ClipboardList;
              return (
                <React.Fragment key={label}>
                  <div className="flex min-w-0 flex-1 items-center gap-2">
                    <div
                      className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-[11px] font-semibold transition-all duration-200 ${
                        isCompleted
                          ? "bg-primary text-white shadow-sm"
                          : isActive
                            ? "bg-primary/10 text-primary ring-2 ring-primary/30"
                            : "bg-surface-page text-text-muted ring-1 ring-surface-border"
                      }`}
                    >
                      {isCompleted ? (
                        <Check className="h-3.5 w-3.5" />
                      ) : (
                        <StepIcon className="h-3.5 w-3.5" />
                      )}
                    </div>
                    <span
                      className={`hidden truncate text-[11px] font-medium transition-colors sm:inline ${
                        isActive
                          ? "text-text-heading"
                          : isCompleted
                            ? "text-primary"
                            : "text-text-muted"
                      }`}
                    >
                      {label}
                    </span>
                  </div>
                  {idx < stepLabels.length - 1 && (
                    <div
                      className={`h-0.5 flex-1 rounded-full transition-colors duration-300 ${
                        isCompleted ? "bg-primary" : "bg-surface-border"
                      }`}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </DialogHeader>
        <div className="px-6 py-5">
          {step === 1 && renderStep1()}
          {step === 2 && compensationType === "equity" && renderEquityConfig()}
          {step === 2 && compensationType === "fixed" && renderFixedConfig()}
          {step === 2 && compensationType === "hourly" && renderHourlyConfig()}
          {step === 2 &&
            compensationType === "equity-fixed" &&
            renderEquityConfig()}
          {step === 3 &&
            compensationType === "equity-fixed" &&
            renderFixedConfig()}
          {step === totalSteps &&
            compensationType !== "unpaid" &&
            renderSummary()}
          {step === 2 && compensationType === "unpaid" && renderSummary()}
        </div>
        <div className="flex items-center justify-between gap-2 border-t border-surface-border bg-surface-page/40 px-6 py-4">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={step === 1}
            className="rounded-lg border-surface-border bg-surface-card font-medium text-text-body hover:bg-surface-page disabled:opacity-50"
          >
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            Back
          </Button>
          <div className="hidden text-[11px] text-text-muted sm:block">
            Step{" "}
            <span className="font-semibold text-text-heading">{step}</span> of{" "}
            <span className="font-semibold text-text-heading">
              {totalSteps}
            </span>
          </div>
          <Button
            onClick={handleNext}
            className={`rounded-lg font-semibold shadow-sm transition-all ${
              isFinalStep
                ? "bg-gradient-to-r from-status-success to-emerald-500 text-white hover:from-emerald-600 hover:to-emerald-500 hover:shadow-md"
                : "bg-primary text-white hover:bg-primary-hover hover:shadow-md"
            }`}
          >
            {isFinalStep ? (
              <>
                <Check className="mr-1.5 h-4 w-4" />
                Complete Setup
              </>
            ) : (
              <>
                Next
                <ChevronRight className="ml-1 h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
