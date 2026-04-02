import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Badge } from "../ui/badge";
import { Progress } from "../ui/progress";
import {
  DollarSign,
  Percent,
  AlertCircle,
  CheckCircle2,
  Clock,
  Award,
  Target,
} from "lucide-react";
export default function CompensationStatusCard({ status, contract }) {
  if (!status || !contract) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            My Compensation
          </CardTitle>
          <CardDescription>No compensation contract set up yet</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Your founder hasn't set up a compensation contract yet. Contact them
            to discuss compensation.
          </p>
        </CardContent>
      </Card>
    );
  }
  const { equity, payment, performance } = status;
  const isOnTrack = performance?.onTrack || false;
  const threshold = performance?.threshold || 80;
  const completionRate = performance?.completionRate || 0;
  const tasksRemaining = performance?.totalTasks
    ? Math.max(
        0,
        Math.ceil(
          (threshold / 100) * performance.totalTasks -
            performance.completedTasks,
        ),
      )
    : 0;
  return (
    <div className="space-y-3">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <DollarSign className="w-5 h-5" />
            My Compensation
          </CardTitle>
          <CardDescription className="text-xs">
            Your current compensation status and progress
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {performance && (
            <div className="p-3 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">
                  This Period Performance
                </span>
                <Badge
                  variant={isOnTrack ? "default" : "destructive"}
                  className="text-xs"
                >
                  {completionRate}%
                </Badge>
              </div>
              <Progress value={completionRate} className="h-2 mb-2" />
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">
                  {performance.completedTasks}/{performance.totalTasks}
                  {" tasks completed"}
                </span>
                <span
                  className={
                    isOnTrack
                      ? "text-green-600 dark:text-green-400"
                      : "text-orange-600 dark:text-orange-400"
                  }
                >
                  {"Threshold: "}
                  {threshold}%
                </span>
              </div>
              {performance.blockedTasks > 0 && (
                <div className="mt-2 flex items-center justify-between text-xs p-2 bg-red-50 dark:bg-red-950/20 rounded">
                  <span className="text-muted-foreground">
                    {performance.blockedTasks}
                    {" task"}
                    {performance.blockedTasks > 1 ? "s" : ""}
                    {" blocked"}
                  </span>
                  <Badge variant="destructive" className="text-xs">
                    {performance.blockerRate}% blocker rate
                  </Badge>
                </div>
              )}
              {!isOnTrack && tasksRemaining > 0 && (
                <div className="mt-2 flex items-start gap-2 p-2 bg-orange-50 dark:bg-orange-950/20 rounded text-xs">
                  <AlertCircle className="w-4 h-4 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
                  <span className="text-orange-700 dark:text-orange-300">
                    {"Complete "}
                    {tasksRemaining}
                    {" more task"}
                    {tasksRemaining > 1 ? "s" : ""}
                    {" to reach threshold"}
                  </span>
                </div>
              )}
              {isOnTrack && (
                <div className="mt-2 flex items-start gap-2 p-2 bg-green-50 dark:bg-green-950/20 rounded text-xs">
                  <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                  <span className="text-green-700 dark:text-green-300">
                    On track! Keep up the great work
                  </span>
                </div>
              )}
            </div>
          )}
          {equity && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Percent className="w-4 h-4 text-primary" />
                <h4 className="text-sm font-semibold">💎 Equity Vesting</h4>
              </div>
              <div className="p-3 border rounded-lg space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-muted-foreground">
                      Total Equity
                    </span>
                    <span className="text-sm font-semibold">
                      {equity.totalEquity}%
                    </span>
                  </div>
                  <Progress value={equity.vestingProgress} className="h-2" />
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-muted-foreground">
                      Progress
                    </span>
                    <span className="text-xs font-medium">
                      {equity.vestingProgress}%
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-2 border-t">
                  <div>
                    <div className="text-xs text-muted-foreground">Vested</div>
                    <div className="text-sm font-semibold text-green-600 dark:text-green-400">
                      {equity.vestedEquity}% ✅
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">
                      Remaining
                    </div>
                    <div className="text-sm font-semibold text-muted-foreground">
                      {equity.unvestedEquity}% 🔒
                    </div>
                  </div>
                </div>
                {!equity.cliffPassed && equity.cliffDate && (
                  <div className="p-2 bg-blue-50 dark:bg-blue-950/20 rounded text-xs">
                    <div className="flex items-center gap-1 text-blue-700 dark:text-blue-300">
                      <Clock className="w-3 h-3" />
                      <span>
                        {"Cliff period: "}
                        {new Date(equity.cliffDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                )}
                <div className="text-xs text-muted-foreground">
                  {"Vesting periods: "}
                  {equity.vestingPeriods.vested}/{equity.vestingPeriods.total}
                  {" completed"}
                </div>
              </div>
            </div>
          )}
          {payment && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-4 h-4 text-green-600" />
                <h4 className="text-sm font-semibold">💰 Payment Status</h4>
              </div>
              <div className="p-3 border rounded-lg space-y-2">
                {payment.type === "fixed" && (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        Monthly Payment
                      </span>
                      <span className="text-lg font-semibold">
                        ${payment.amount}
                      </span>
                    </div>
                    <div className="pt-2 border-t">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          This Period
                        </span>
                        <Badge
                          variant={
                            payment.currentPeriodEligible
                              ? "default"
                              : "destructive"
                          }
                          className="text-xs"
                        >
                          {payment.currentPeriodEligible
                            ? "Eligible"
                            : "Not Eligible"}
                        </Badge>
                      </div>
                      <div className="mt-1 text-sm font-semibold">
                        ${payment.currentPeriodAmount.toFixed(2)}
                        {payment.currentPeriodAmount < payment.amount &&
                          payment.currentPeriodAmount > 0 && (
                            <span className="text-xs text-muted-foreground ml-1">
                              (partial payment)
                            </span>
                          )}
                      </div>
                    </div>
                  </>
                )}
                {payment.type === "hourly" && (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        Hourly Rate
                      </span>
                      <span className="text-lg font-semibold">
                        ${payment.rate}/hr
                      </span>
                    </div>
                    <div className="pt-2 border-t">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-muted-foreground">
                          Hours Logged
                        </span>
                        <span className="text-sm font-medium">
                          {payment.hoursLogged}
                          {" hrs"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          This Period
                        </span>
                        <Badge
                          variant={
                            payment.currentPeriodEligible
                              ? "default"
                              : "destructive"
                          }
                          className="text-xs"
                        >
                          {payment.currentPeriodEligible
                            ? "Eligible"
                            : "Not Eligible"}
                        </Badge>
                      </div>
                      <div className="mt-1 text-sm font-semibold">
                        ${payment.currentPeriodAmount.toFixed(2)}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
          {!performance && (
            <div className="p-3 bg-muted/50 rounded-lg text-center">
              <Target className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm font-medium mb-1">
                No Performance Data Yet
              </p>
              <p className="text-xs text-muted-foreground">
                Start completing tasks to see your compensation progress
              </p>
            </div>
          )}
        </CardContent>
      </Card>
      {performance && !isOnTrack && (
        <Card className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20 border-orange-200 dark:border-orange-800">
          <CardContent className="p-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-orange-900 dark:text-orange-100 mb-1">
                  Boost Your Performance
                </p>
                <p className="text-xs text-orange-700 dark:text-orange-300">
                  {equity &&
                    `Complete ${tasksRemaining} more tasks to unlock equity vesting. `}
                  {payment &&
                    `Stay above ${threshold}% to receive your payment. `}
                  Don't let this period slip away!
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      {performance && isOnTrack && (
        <Card className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-200 dark:border-green-800">
          <CardContent className="p-3">
            <div className="flex items-start gap-2">
              <Award className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-green-900 dark:text-green-100 mb-1">
                  Excellent Work! 🎉
                </p>
                <p className="text-xs text-green-700 dark:text-green-300">
                  {"You're above the "}
                  {threshold}% threshold.{equity && ` Your equity is vesting!`}
                  {payment && ` Your payment is secured!`} Keep up the momentum!
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
