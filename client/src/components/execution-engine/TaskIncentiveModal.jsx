import React, { useState } from "react";
import { Button } from "../ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { X, DollarSign, TrendingUp, Clock, Gift } from "lucide-react";
export default function TaskIncentiveModal({
  isOpen,
  onClose,
  task,
  onIncentiveSet,
}) {
  const [selectedType, setSelectedType] = useState(
    task.incentive?.type || "unpaid",
  );
  const [equity, setEquity] = useState(task.incentive?.equity || "");
  const [pay, setPay] = useState(task.incentive?.pay || "");
  const [hourlyRate, setHourlyRate] = useState(
    task.incentive?.hourlyRate || "",
  );
  if (!isOpen) return null;
  const handleSave = () => {
    const incentive = {
      type: selectedType,
    };
    if (selectedType === "equity") {
      incentive.equity = equity;
    } else if (selectedType === "paid") {
      incentive.pay = pay;
    } else if (selectedType === "hourly") {
      incentive.hourlyRate = hourlyRate;
    }
    onIncentiveSet(incentive);
    onClose();
  };
  const incentiveTypes = [
    {
      type: "equity",
      label: "Equity Only",
      description: "Offer equity compensation",
      icon: TrendingUp,
      color: "text-blue-600 dark:text-blue-400",
    },
    {
      type: "paid",
      label: "Fixed Payment",
      description: "One-time or monthly stipend",
      icon: DollarSign,
      color: "text-green-600 dark:text-green-400",
    },
    {
      type: "hourly",
      label: "Hourly Rate",
      description: "Pay by the hour",
      icon: Clock,
      color: "text-purple-600 dark:text-purple-400",
    },
    {
      type: "unpaid",
      label: "Unpaid / Volunteer",
      description: "No immediate compensation",
      icon: Gift,
      color: "text-gray-600 dark:text-gray-400",
    },
  ];
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sv-modal-backdrop">
      <Card className="sv-modal-panel max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-[16px] border-0 shadow-modal">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-lg flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-primary" />
                Set Task Incentive
              </CardTitle>
              <CardDescription className="mt-1 text-sm">
                {task.title}
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-3 block">
              Compensation Type
            </label>
            <div className="grid grid-cols-2 gap-3">
              {incentiveTypes.map((incentiveType) => {
                const Icon = incentiveType.icon;
                const isSelected = selectedType === incentiveType.type;
                return (
                  <div
                    key={incentiveType.type}
                    className={`p-3 border-2 rounded-lg cursor-pointer transition-all ${isSelected ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}
                    onClick={() => setSelectedType(incentiveType.type)}
                  >
                    <div className="flex items-start gap-2">
                      <Icon
                        className={`w-5 h-5 ${incentiveType.color} flex-shrink-0 mt-0.5`}
                      />
                      <div>
                        <p className="font-medium text-sm">
                          {incentiveType.label}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {incentiveType.description}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          {selectedType === "equity" && (
            <div>
              <label className="text-sm font-medium mb-2 block">
                Equity Percentage
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={equity}
                  onChange={(e) => setEquity(e.target.value)}
                  placeholder="e.g., 0.5%, 1%, 2%"
                  className="w-full p-2 pr-8 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <TrendingUp className="absolute right-2 top-2.5 w-4 h-4 text-muted-foreground" />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Typical range: 0.1% - 5% for early team members
              </p>
            </div>
          )}
          {selectedType === "paid" && (
            <div>
              <label className="text-sm font-medium mb-2 block">
                Payment Amount
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={pay}
                  onChange={(e) => setPay(e.target.value)}
                  placeholder="e.g., $500/month, $3000 one-time"
                  className="w-full p-2 pl-8 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <DollarSign className="absolute left-2 top-2.5 w-4 h-4 text-muted-foreground" />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Specify amount and frequency (monthly, one-time, etc.)
              </p>
            </div>
          )}
          {selectedType === "hourly" && (
            <div>
              <label className="text-sm font-medium mb-2 block">
                Hourly Rate
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={hourlyRate}
                  onChange={(e) => setHourlyRate(e.target.value)}
                  placeholder="e.g., $25/hr, $50/hr"
                  className="w-full p-2 pl-8 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <DollarSign className="absolute left-2 top-2.5 w-4 h-4 text-muted-foreground" />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Specify the hourly compensation rate
              </p>
            </div>
          )}
          {selectedType === "unpaid" && (
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">
                This task will be marked as unpaid/volunteer work. Consider
                offering equity or other non-monetary benefits to attract
                quality contributors.
              </p>
            </div>
          )}
          <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg">
            <p className="text-xs text-blue-900 dark:text-blue-100">
              <strong>Note:</strong>
              {
                " StartupVerse records compensation terms but does not handle payments or equity issuance. You're responsible for fulfilling these commitments through your company."
              }
            </p>
          </div>
          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              className="flex-1"
              disabled={
                (selectedType === "equity" && !equity) ||
                (selectedType === "paid" && !pay) ||
                (selectedType === "hourly" && !hourlyRate)
              }
            >
              Save Incentive
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
