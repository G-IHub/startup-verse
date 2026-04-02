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
import { Badge } from "../ui/badge";
import { Checkbox } from "../ui/checkbox";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Progress } from "../ui/progress";
import {
  ArrowRight,
  ArrowLeft,
  Check,
  Info,
  AlertCircle,
  TrendingUp,
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
  const renderStep1 = () => (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-2">Choose Compensation Type</h3>
        <p className="text-sm text-muted-foreground mb-4">
          {"Select how you'd like to compensate "}
          {teamMemberName}
        </p>
      </div>
      <RadioGroup value={compensationType} onValueChange={setCompensationType}>
        <div className="space-y-3">
          <div
            className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${compensationType === "equity" ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}
            onClick={() => setCompensationType("equity")}
          >
            <div className="flex items-start gap-3">
              <RadioGroupItem value="equity" id="equity" />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Label
                    htmlFor="equity"
                    className="text-base font-semibold cursor-pointer"
                  >
                    Equity Only
                  </Label>
                </div>
                <p className="text-sm text-muted-foreground">
                  Offer equity compensation with vesting schedule
                </p>
                <Badge variant="outline" className="mt-2 text-xs">
                  Best for: Early team, high risk/reward
                </Badge>
              </div>
            </div>
          </div>
          <div
            className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${compensationType === "fixed" ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}
            onClick={() => setCompensationType("fixed")}
          >
            <div className="flex items-start gap-3">
              <RadioGroupItem value="fixed" id="fixed" />
              <div className="flex-1">
                <Label
                  htmlFor="fixed"
                  className="text-base font-semibold cursor-pointer block mb-1"
                >
                  Fixed Payment
                </Label>
                <p className="text-sm text-muted-foreground">
                  Monthly or one-time stipend
                </p>
                <Badge variant="outline" className="mt-2 text-xs">
                  Best for: Contractors, specific roles
                </Badge>
              </div>
            </div>
          </div>
          <div
            className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${compensationType === "hourly" ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}
            onClick={() => setCompensationType("hourly")}
          >
            <div className="flex items-start gap-3">
              <RadioGroupItem value="hourly" id="hourly" />
              <div className="flex-1">
                <Label
                  htmlFor="hourly"
                  className="text-base font-semibold cursor-pointer block mb-1"
                >
                  Hourly Rate
                </Label>
                <p className="text-sm text-muted-foreground">
                  Pay by the hour worked
                </p>
                <Badge variant="outline" className="mt-2 text-xs">
                  Best for: Part-time, flexible roles
                </Badge>
              </div>
            </div>
          </div>
          <div
            className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${compensationType === "equity-fixed" ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}
            onClick={() => setCompensationType("equity-fixed")}
          >
            <div className="flex items-start gap-3">
              <RadioGroupItem value="equity-fixed" id="equity-fixed" />
              <div className="flex-1">
                <Label
                  htmlFor="equity-fixed"
                  className="text-base font-semibold cursor-pointer block mb-1"
                >
                  Equity + Fixed Payment
                </Label>
                <p className="text-sm text-muted-foreground">
                  Combine equity and cash compensation
                </p>
                <Badge variant="outline" className="mt-2 text-xs">
                  Best for: Key hires who need income
                </Badge>
              </div>
            </div>
          </div>
          <div
            className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${compensationType === "unpaid" ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}
            onClick={() => setCompensationType("unpaid")}
          >
            <div className="flex items-start gap-3">
              <RadioGroupItem value="unpaid" id="unpaid" />
              <div className="flex-1">
                <Label
                  htmlFor="unpaid"
                  className="text-base font-semibold cursor-pointer block mb-1"
                >
                  Unpaid / Volunteer
                </Label>
                <p className="text-sm text-muted-foreground">
                  No immediate compensation
                </p>
                <Badge variant="outline" className="mt-2 text-xs">
                  Best for: Co-founders, interns
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </RadioGroup>
    </div>
  );
  const renderEquityConfig = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Equity Configuration</h3>
        <p className="text-sm text-muted-foreground">
          {"Set up the equity vesting schedule for "}
          {teamMemberName}
        </p>
      </div>
      <div className="space-y-4 p-4 rounded-lg border bg-muted/30">
        <h4 className="text-sm font-semibold">Basic Settings</h4>
        <div className="space-y-2">
          <Label htmlFor="equityTotal">Total Equity (%)</Label>
          <Input
            id="equityTotal"
            type="number"
            step="0.1"
            value={equityTotal}
            onChange={(e) => setEquityTotal(e.target.value)}
            placeholder="2.5"
          />
          <p className="text-xs text-muted-foreground">
            Typical range: 0.5% - 5% for early team members
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="vestingPeriod">Vesting Period (months)</Label>
          <Input
            id="vestingPeriod"
            type="number"
            value={vestingPeriod}
            onChange={(e) => setVestingPeriod(e.target.value)}
            placeholder="12"
          />
          <p className="text-xs text-muted-foreground">Typical: 12-48 months</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="vestingFrequency">Vesting Frequency</Label>
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
          <p className="text-xs text-muted-foreground">
            Monthly is most common
          </p>
        </div>
      </div>
      <div className="space-y-4 p-4 rounded-lg border bg-muted/30">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-semibold">Cliff Period</h4>
            <p className="text-xs text-muted-foreground">
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
          <div className="space-y-2 pt-2 border-t">
            <Label htmlFor="cliffPeriod">Cliff Period (months)</Label>
            <Input
              id="cliffPeriod"
              type="number"
              value={cliffPeriod}
              onChange={(e) => setCliffPeriod(e.target.value)}
              placeholder="3"
            />
            <p className="text-xs text-muted-foreground">
              Standard is 3-6 months
            </p>
          </div>
        )}
      </div>
      <div className="space-y-4 p-4 rounded-lg border bg-muted/30">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-semibold">Performance Gating</h4>
            <p className="text-xs text-muted-foreground">
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
          <div className="space-y-4 pt-2 border-t">
            <div className="space-y-2">
              <Label htmlFor="equityThreshold">Performance Threshold (%)</Label>
              <Input
                id="equityThreshold"
                type="number"
                value={equityThreshold}
                onChange={(e) => setEquityThreshold(e.target.value)}
                placeholder="80"
              />
              <p className="text-xs text-muted-foreground">
                Must complete this % of tasks to vest that period's equity
              </p>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">
                  Enable Partial Vesting
                </Label>
                <p className="text-xs text-muted-foreground">
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
              <div className="p-3 bg-background rounded-lg border">
                <p className="text-xs font-medium mb-2">
                  Partial Vesting Scale:
                </p>
                <p className="text-xs text-muted-foreground">
                  {equityThreshold}%+ completion = 100% vesting
                  <br />
                  60-{parseInt(equityThreshold) - 1}% = 50% vesting
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
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">
          Fixed Payment Configuration
        </h3>
        <p className="text-sm text-muted-foreground">
          {"Set up the payment structure for "}
          {teamMemberName}
        </p>
      </div>
      <div className="space-y-4 p-4 rounded-lg border bg-muted/30">
        <h4 className="text-sm font-semibold">Basic Settings</h4>
        <div className="space-y-2">
          <Label>Payment Type</Label>
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
        <div className="space-y-2">
          <Label htmlFor="fixedAmount">Amount ($)</Label>
          <Input
            id="fixedAmount"
            type="number"
            value={fixedAmount}
            onChange={(e) => setFixedAmount(e.target.value)}
            placeholder="3000"
          />
        </div>
        <div className="space-y-2">
          <Label>Payment Schedule</Label>
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
      <div className="space-y-4 p-4 rounded-lg border bg-muted/30">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-semibold">Performance Gating</h4>
            <p className="text-xs text-muted-foreground">
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
          <div className="space-y-4 pt-2 border-t">
            <div className="space-y-2">
              <Label htmlFor="fixedThreshold">Performance Threshold (%)</Label>
              <Input
                id="fixedThreshold"
                type="number"
                value={fixedThreshold}
                onChange={(e) => setFixedThreshold(e.target.value)}
                placeholder="80"
              />
              <p className="text-xs text-muted-foreground">
                Must complete this % of tasks for payment
              </p>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">
                  Enable Partial Payments
                </Label>
                <p className="text-xs text-muted-foreground">
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
              <div className="p-3 bg-background rounded-lg border">
                <p className="text-xs font-medium mb-2">
                  Partial Payment Scale:
                </p>
                <p className="text-xs text-muted-foreground">
                  {fixedThreshold}%+ completion = 100% payment (${fixedAmount})
                  <br />
                  60-{parseInt(fixedThreshold) - 1}% = 70% payment ($
                  {(parseFloat(fixedAmount) * 0.7).toFixed(0)})<br />
                  40-59% = 40% payment ($
                  {(parseFloat(fixedAmount) * 0.4).toFixed(0)})<br />
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
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">
          Hourly Rate Configuration
        </h3>
        <p className="text-sm text-muted-foreground">
          {"Set up the hourly payment structure for "}
          {teamMemberName}
        </p>
      </div>
      <div className="space-y-4 p-4 rounded-lg border bg-muted/30">
        <h4 className="text-sm font-semibold">Basic Settings</h4>
        <div className="space-y-2">
          <Label htmlFor="hourlyRate">Hourly Rate ($)</Label>
          <Input
            id="hourlyRate"
            type="number"
            value={hourlyRate}
            onChange={(e) => setHourlyRate(e.target.value)}
            placeholder="50"
          />
        </div>
        <div className="space-y-2">
          <Label>Hour Tracking Method</Label>
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
          <p className="text-xs text-muted-foreground">
            Self-report is faster but less strict
          </p>
        </div>
        <div className="space-y-2">
          <Label>Payment Frequency</Label>
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
      <div className="space-y-4 p-4 rounded-lg border bg-muted/30">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-semibold">Weekly Hour Cap</h4>
            <p className="text-xs text-muted-foreground">
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
          <div className="space-y-2 pt-2 border-t">
            <Label htmlFor="maxHoursPerWeek">Maximum Hours Per Week</Label>
            <Input
              id="maxHoursPerWeek"
              type="number"
              value={maxHoursPerWeek}
              onChange={(e) => setMaxHoursPerWeek(e.target.value)}
              placeholder="40"
            />
            <p className="text-xs text-muted-foreground">
              Payment will cap at this many hours per week
            </p>
          </div>
        )}
      </div>
      <div className="space-y-4 p-4 rounded-lg border bg-muted/30">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-semibold">Performance Gating</h4>
            <p className="text-xs text-muted-foreground">
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
          <div className="space-y-2 pt-2 border-t">
            <Label htmlFor="hourlyThreshold">Performance Threshold (%)</Label>
            <Input
              id="hourlyThreshold"
              type="number"
              value={hourlyThreshold}
              onChange={(e) => setHourlyThreshold(e.target.value)}
              placeholder="75"
            />
            <p className="text-xs text-muted-foreground">
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
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-2">Compensation Summary</h3>
          <p className="text-sm text-muted-foreground">
            {"Review the compensation package for "}
            {teamMemberName}
          </p>
        </div>
        <div className="p-5 bg-primary/5 border-2 border-primary rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <Check className="w-5 h-5 text-primary flex-shrink-0" />
            <p className="font-semibold text-lg text-primary">
              {compensationTitle}
            </p>
          </div>
          <p className="text-sm text-muted-foreground ml-7">
            {"For "}
            {teamMemberName}
          </p>
        </div>
        {equityDetails.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-1 h-4 bg-primary rounded-full" />
              <h4 className="text-sm font-semibold">Equity Details</h4>
            </div>
            <div className="p-4 rounded-lg border bg-muted/30 space-y-2.5">
              {equityDetails.map((detail, idx) => (
                <div
                  key={idx}
                  className="flex justify-between items-center text-sm"
                >
                  <span className="text-muted-foreground">{detail.label}</span>
                  <span className="font-medium">{detail.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {paymentDetails.length > 0 && compensationType !== "unpaid" && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-1 h-4 bg-green-600 rounded-full" />
              <h4 className="text-sm font-semibold">Payment Details</h4>
            </div>
            <div className="p-4 rounded-lg border bg-muted/30 space-y-2.5">
              {paymentDetails.map((detail, idx) => (
                <div
                  key={idx}
                  className="flex justify-between items-center text-sm"
                >
                  <span className="text-muted-foreground">{detail.label}</span>
                  <span className="font-medium">{detail.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {compensationType === "unpaid" && (
          <div className="p-4 rounded-lg border bg-muted/30">
            <p className="text-sm text-muted-foreground">
              {teamMemberName}
              {
                " will participate as an unpaid volunteer or co-founder with no immediate monetary compensation."
              }
            </p>
          </div>
        )}
        {(equityPerformanceGated ||
          fixedPerformanceGated ||
          hourlyPerformanceGated) && (
          <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-start gap-3">
              <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="space-y-2">
                <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                  Performance-Based Compensation
                </p>
                <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
                  {"Compensation is tied to task completion rates. "}
                  {teamMemberName}
                  {
                    " can track their performance in real-time and see exactly what they need to complete to unlock their compensation each period."
                  }
                </p>
              </div>
            </div>
          </div>
        )}
        <div className="p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg border border-purple-200 dark:border-purple-800">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-2">
              <p className="text-sm font-semibold text-purple-900 dark:text-purple-100">
                Team Member Dashboard
              </p>
              <p className="text-xs text-purple-700 dark:text-purple-300 mb-2">
                {teamMemberName}
                {" will see:"}
              </p>
              <ul className="text-xs text-purple-700 dark:text-purple-300 space-y-1.5">
                <li className="flex items-start gap-2">
                  <span className="text-purple-500 mt-0.5">•</span>
                  <span>Current task completion percentage</span>
                </li>
                {(equityPerformanceGated ||
                  fixedPerformanceGated ||
                  hourlyPerformanceGated) && (
                  <li className="flex items-start gap-2">
                    <span className="text-purple-500 mt-0.5">•</span>
                    <span>Performance threshold and eligibility status</span>
                  </li>
                )}
                {(compensationType === "equity" ||
                  compensationType === "equity-fixed") && (
                  <li className="flex items-start gap-2">
                    <span className="text-purple-500 mt-0.5">•</span>
                    <span>Equity vesting progress and timeline</span>
                  </li>
                )}
                {compensationType !== "unpaid" &&
                  compensationType !== "equity" && (
                    <li className="flex items-start gap-2">
                      <span className="text-purple-500 mt-0.5">•</span>
                      <span>Payment eligibility and next payment date</span>
                    </li>
                  )}
              </ul>
            </div>
          </div>
        </div>
        <div className="p-4 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-200 dark:border-orange-800">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-semibold text-orange-900 dark:text-orange-100">
                Compensation Contract
              </p>
              <p className="text-xs text-orange-700 dark:text-orange-300 leading-relaxed">
                {"This contract will be visible to "}
                {teamMemberName}
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
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Team Onboarding & Compensation</DialogTitle>
          <DialogDescription>
            {"Setting up "}
            {teamMemberName}
            {" • Step "}
            {step}
            {" of "}
            {totalSteps}
          </DialogDescription>
          <Progress value={(step / totalSteps) * 100} className="mt-2" />
        </DialogHeader>
        <div className="py-4">
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
        <div className="flex justify-between gap-2 pt-4 border-t">
          <Button variant="outline" onClick={handleBack} disabled={step === 1}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <Button onClick={handleNext}>
            {step === totalSteps ||
            (step === 2 && compensationType === "unpaid") ? (
              <>
                <Check className="w-4 h-4 mr-2" />
                Complete Setup
              </>
            ) : (
              <>
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
