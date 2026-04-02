/**
 * COHORT HOME PAGE
 * Overview dashboard showing key metrics and quick actions
 */
import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Activity,
  Target,
  Calendar,
  ArrowRight,
  CheckCircle2,
  UserPlus,
} from "lucide-react";
export default function CohortHomePage({
  cohort,
  onNavigate,
  onInviteClick,
  isAdmin,
  organizationName,
  organizationType,
  onBack,
}) {
  const stats = cohort.stats || {
    totalStartups: 0,
    activeStartups: 0,
    slowingStartups: 0,
    stalledStartups: 0,
  };
  const healthPercentage =
    stats.totalStartups > 0
      ? Math.round((stats.activeStartups / stats.totalStartups) * 100)
      : 0;
  const getHealthStatus = () => {
    if (healthPercentage >= 80)
      return {
        label: "Excellent",
        color: "text-green-600",
        bgColor: "bg-green-50 dark:bg-green-950/20",
      };
    if (healthPercentage >= 60)
      return {
        label: "Good",
        color: "text-blue-600",
        bgColor: "bg-blue-50 dark:bg-blue-950/20",
      };
    if (healthPercentage >= 40)
      return {
        label: "Needs Attention",
        color: "text-yellow-600",
        bgColor: "bg-yellow-50 dark:bg-yellow-950/20",
      };
    return {
      label: "Critical",
      color: "text-red-600",
      bgColor: "bg-red-50 dark:bg-red-950/20",
    };
  };
  const healthStatus = getHealthStatus();
  return (
    <div className="space-y-4">
      <Card className={healthStatus.bgColor}>
        <CardHeader className="pb-3">
          <CardTitle className="text-[11px]">Cohort Health Score</CardTitle>
          <CardDescription className="text-[9px]">
            Overall portfolio performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[32px] font-bold tracking-tight">
                {healthPercentage}%
              </div>
              <Badge
                className={`${healthStatus.color} text-[8px] mt-1`}
                variant="outline"
              >
                {healthStatus.label}
              </Badge>
            </div>
            <div className="text-right">
              <div className="text-[10px] text-muted-foreground mb-1">
                {stats.activeStartups}
                {" of "}
                {stats.totalStartups}
                {" active"}
              </div>
              {stats.slowingStartups > 0 && (
                <div className="text-[9px] text-yellow-600 flex items-center gap-1 justify-end">
                  <AlertTriangle className="w-3 h-3" />
                  {stats.slowingStartups}
                  {" slowing"}
                </div>
              )}
              {stats.stalledStartups > 0 && (
                <div className="text-[9px] text-red-600 flex items-center gap-1 justify-end">
                  <TrendingDown className="w-3 h-3" />
                  {stats.stalledStartups}
                  {" stalled"}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      <div className="grid grid-cols-4 gap-3">
        <Card
          className="hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => onNavigate("portfolio")}
        >
          <CardContent className="p-3 text-center">
            <Activity className="w-5 h-5 text-primary mx-auto mb-1.5" />
            <div className="text-[16px] font-bold">{stats.totalStartups}</div>
            <div className="text-[8px] text-muted-foreground uppercase">
              Total Startups
            </div>
          </CardContent>
        </Card>
        <Card
          className="hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => onNavigate("portfolio")}
        >
          <CardContent className="p-3 text-center">
            <TrendingUp className="w-5 h-5 text-green-600 mx-auto mb-1.5" />
            <div className="text-[16px] font-bold text-green-600">
              {stats.activeStartups}
            </div>
            <div className="text-[8px] text-muted-foreground uppercase">
              Active
            </div>
          </CardContent>
        </Card>
        <Card
          className="hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => onNavigate("portfolio")}
        >
          <CardContent className="p-3 text-center">
            <AlertTriangle className="w-5 h-5 text-yellow-600 mx-auto mb-1.5" />
            <div className="text-[16px] font-bold text-yellow-600">
              {stats.slowingStartups}
            </div>
            <div className="text-[8px] text-muted-foreground uppercase">
              Slowing
            </div>
          </CardContent>
        </Card>
        <Card
          className="hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => onNavigate("portfolio")}
        >
          <CardContent className="p-3 text-center">
            <TrendingDown className="w-5 h-5 text-red-600 mx-auto mb-1.5" />
            <div className="text-[16px] font-bold text-red-600">
              {stats.stalledStartups}
            </div>
            <div className="text-[8px] text-muted-foreground uppercase">
              Stalled
            </div>
          </CardContent>
        </Card>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <Card
          className="hover:border-primary/50 transition-colors cursor-pointer"
          onClick={() => onNavigate("portfolio")}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary" />
              View Portfolio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-[9px] text-muted-foreground mb-2">
              See all startups and their execution health
            </p>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-[9px] w-full justify-between"
            >
              Open Portfolio
              <ArrowRight className="w-3 h-3" />
            </Button>
          </CardContent>
        </Card>
        <Card
          className="hover:border-primary/50 transition-colors cursor-pointer"
          onClick={() => onNavigate("analytics")}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] flex items-center gap-2">
              <Target className="w-4 h-4 text-blue-600" />
              Analytics Dashboard
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-[9px] text-muted-foreground mb-2">
              Deep insights and performance metrics
            </p>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-[9px] w-full justify-between"
            >
              View Analytics
              <ArrowRight className="w-3 h-3" />
            </Button>
          </CardContent>
        </Card>
        <Card
          className="hover:border-primary/50 transition-colors cursor-pointer"
          onClick={() => onNavigate("milestones")}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              Program Milestones
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-[9px] text-muted-foreground mb-2">
              Track cohort-wide milestones and goals
            </p>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-[9px] w-full justify-between"
            >
              Manage Milestones
              <ArrowRight className="w-3 h-3" />
            </Button>
          </CardContent>
        </Card>
        <Card
          className="hover:border-primary/50 transition-colors cursor-pointer"
          onClick={() => onNavigate("events")}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] flex items-center gap-2">
              <Calendar className="w-4 h-4 text-purple-600" />
              Upcoming Events
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-[9px] text-muted-foreground mb-2">
              Schedule workshops, demo days, and more
            </p>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-[9px] w-full justify-between"
            >
              View Calendar
              <ArrowRight className="w-3 h-3" />
            </Button>
          </CardContent>
        </Card>
        {isAdmin && onInviteClick && (
          <Card
            className="hover:border-primary/50 transition-colors cursor-pointer bg-primary/5"
            onClick={onInviteClick}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-[10px] flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-primary" />
                Invite Startup
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-[9px] text-muted-foreground mb-2">
                Add new startups to this cohort
              </p>
              <Button
                size="sm"
                className="h-6 text-[9px] w-full justify-between"
              >
                Send Invitation
                <ArrowRight className="w-3 h-3" />
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-[11px]">Quick Stats</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[9px]">
              <span className="text-muted-foreground">Avg Health Score</span>
              <span className="font-semibold">{healthPercentage}%</span>
            </div>
            <div className="flex items-center justify-between text-[9px]">
              <span className="text-muted-foreground">Active Rate</span>
              <span className="font-semibold text-green-600">
                {stats.totalStartups > 0
                  ? Math.round(
                      (stats.activeStartups / stats.totalStartups) * 100,
                    )
                  : 0}
                %
              </span>
            </div>
            {stats.slowingStartups > 0 && (
              <div className="flex items-center justify-between text-[9px]">
                <span className="text-muted-foreground">Needs Attention</span>
                <span className="font-semibold text-yellow-600">
                  {stats.slowingStartups + stats.stalledStartups}
                  {" startups"}
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
