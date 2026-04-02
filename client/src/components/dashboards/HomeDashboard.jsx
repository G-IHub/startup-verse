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
import { getFirstName } from "../../utils/nameHelpers"; // ✅ Safe name handling

export default function HomeDashboard({
  user,
  onNavigate,
  onVirtualOfficeViewChange,
}) {
  const stats = {
    tasksCompleted: 12,
    totalTasks: 18,
    teamSize: 1,
    daysActive: 5,
    upcomingMeetings: 2,
  };
  const quickActions = [
    {
      title: "Virtual Office",
      description: "Your immersive workspace",
      icon: "Building",
      color: "bg-blue-500",
      buttonText: "Open",
      onClick: () => {
        onNavigate("startup-office");
        onVirtualOfficeViewChange?.("workspace");
      },
    },
    {
      title: "Startup Journey",
      description: "6-stage framework",
      icon: "Map",
      color: "bg-purple-500",
      buttonText: "Open",
      onClick: () => {
        onNavigate("startup-office");
        onVirtualOfficeViewChange?.("journey");
      },
    },
    {
      title: "Team Matching",
      description: "Find co-founders",
      icon: "Users",
      color: "bg-green-500",
      buttonText: "Open",
      onClick: () => {
        onNavigate("startup-office");
        onVirtualOfficeViewChange?.("matching");
      },
    },
  ];
  const recentActivity = [
    {
      id: 1,
      title: "Completed market research task",
      time: "2 hours ago",
      icon: "CheckCircle2",
    },
    {
      id: 2,
      title: "Started new product development",
      time: "5 hours ago",
      icon: "Rocket",
    },
    {
      id: 3,
      title: "Team meeting scheduled",
      time: "1 day ago",
      icon: "Clock",
    },
  ];
  return (
    <div className="h-full overflow-auto bg-background">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <h1 className="text-3xl">
              {"Welcome back, "}
              {getFirstName(user.name)}! 👋
            </h1>
          </div>
          <p className="text-muted-foreground">
            Here's what's happening with your startup today
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2.5">
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-muted-foreground">
                    Tasks Progress
                  </p>
                  <p className="text-lg mt-0.5">
                    {stats.tasksCompleted}/{stats.totalTasks}
                  </p>
                </div>
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                </div>
              </div>
              <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all"
                  style={{
                    width: `${(stats.tasksCompleted / stats.totalTasks) * 100}%`,
                  }}
                />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-muted-foreground">Team Size</p>
                  <p className="text-lg mt-0.5">{stats.teamSize}</p>
                </div>
                <div className="w-9 h-9 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <Users className="w-4 h-4 text-green-500" />
                </div>
              </div>
              {stats.teamSize === 1 && (
                <p className="text-[8px] text-muted-foreground mt-2">
                  Find a co-founder to grow faster
                </p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-muted-foreground">
                    Days Active
                  </p>
                  <p className="text-lg mt-0.5">{stats.daysActive}</p>
                </div>
                <div className="w-9 h-9 rounded-lg bg-orange-500/10 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-orange-500" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-muted-foreground">Upcoming</p>
                  <p className="text-lg mt-0.5">{stats.upcomingMeetings}</p>
                </div>
                <div className="w-9 h-9 rounded-lg bg-purple-500/10 flex items-center justify-center">
                  <Clock className="w-4 h-4 text-purple-500" />
                </div>
              </div>
              <p className="text-[8px] text-muted-foreground mt-2">
                {stats.upcomingMeetings === 0
                  ? "No meetings scheduled"
                  : "Meetings today"}
              </p>
            </CardContent>
          </Card>
        </div>
        <div>
          <h2 className="text-base mb-2.5">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
            {quickActions.map((action, idx) => (
              <Card
                key={idx}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={action.onClick}
              >
                <CardHeader>
                  <div
                    className={`w-9 h-9 rounded-lg ${action.color} flex items-center justify-center mb-2`}
                  >
                    <action.icon className="w-4 h-4 text-white" />
                  </div>
                  <CardTitle className="text-sm">{action.title}</CardTitle>
                  <CardDescription className="text-[10px]">
                    {action.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="w-full justify-start text-[10px] h-7"
                  >
                    {action.buttonText}
                    <ArrowRight className="w-3 h-3 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Recent Activity</CardTitle>
              <CardDescription className="text-[10px]">
                What you've been working on
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {recentActivity.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start gap-2 p-2 rounded-lg bg-muted/50"
                >
                  <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <activity.icon className="w-3 h-3 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-medium">{activity.title}</p>
                    <p className="text-[9px] text-muted-foreground">
                      {activity.time}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card className="border-primary/30 bg-primary/5">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Zap className="w-4 h-4 text-primary" />
                Getting Started
              </CardTitle>
              <CardDescription className="text-[10px]">
                Complete these steps to get the most out of StartupVerse
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <span className="text-sm">Create your account</span>
                  <Badge variant="secondary" className="ml-auto text-xs">
                    Done
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <span className="text-sm">Set up your profile</span>
                  <Badge variant="secondary" className="ml-auto text-xs">
                    Done
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full border-2 border-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Complete first task
                  </span>
                  <Badge variant="outline" className="ml-auto text-xs">
                    Pending
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full border-2 border-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Find a co-founder
                  </span>
                  <Badge variant="outline" className="ml-auto text-xs">
                    Pending
                  </Badge>
                </div>
              </div>
              <Button className="w-full gap-2 mt-4">
                <Target className="w-4 h-4" />
                Continue Setup
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
