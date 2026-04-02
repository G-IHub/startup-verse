/**
 * New Week Empty State - Welcoming empty state when starting a fresh week
 */
import React from "react";
import { Card, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";
import {
  Calendar,
  Target,
  Sparkles,
  ArrowRight,
  Lightbulb,
  Zap,
} from "lucide-react";
export function NewWeekEmptyState({
  weekNumber,
  lastWeekCompletion,
  onSetOutcome,
  onUseTemplate,
}) {
  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-blue-950/30 dark:via-purple-950/30 dark:to-pink-950/30 border-blue-200 dark:border-blue-800 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full -mr-32 -mt-32 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-pink-400/20 to-purple-400/20 rounded-full -ml-24 -mb-24 blur-3xl" />
        <CardContent className="p-8 relative z-10">
          <div className="flex items-center justify-center mb-4">
            <div className="p-4 bg-white dark:bg-gray-800 rounded-full shadow-lg">
              <Calendar className="size-12 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <div className="text-center space-y-3">
            <div className="flex items-center justify-center gap-2">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                {"Week "}
                {weekNumber}
              </h2>
              <Badge
                variant="outline"
                className="bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800"
              >
                <Sparkles className="size-3 mr-1" />
                Fresh Start
              </Badge>
            </div>
            <p className="text-lg text-gray-700 dark:text-gray-300 max-w-xl mx-auto">
              Ready to make this week count? Your tasks from last week are
              archived. Time to set a new outcome and create momentum! 🚀
            </p>
            {lastWeekCompletion !== undefined && (
              <div className="flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <Target className="size-4" />
                <span>
                  {"Last week: "}
                  <span className="font-semibold text-gray-900 dark:text-gray-100">
                    {Math.round(lastWeekCompletion)}%
                  </span>
                  {" completed"}
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      <div className="grid md:grid-cols-2 gap-4">
        <Card
          className="group hover:border-blue-300 dark:hover:border-blue-700 transition-all cursor-pointer"
          onClick={onSetOutcome}
        >
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg group-hover:scale-110 transition-transform">
                <Lightbulb className="size-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Set Custom Outcome
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Describe what you want to achieve this week in your own words.
                  AI will help break it down into actionable tasks.
                </p>
                <div className="flex items-center gap-2 text-sm font-medium text-blue-600 dark:text-blue-400">
                  Tell us your goal
                  <ArrowRight className="size-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card
          className="group hover:border-purple-300 dark:hover:border-purple-700 transition-all cursor-pointer"
          onClick={onUseTemplate}
        >
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg group-hover:scale-110 transition-transform">
                <Zap className="size-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Choose Template
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Browse pre-built weekly outcomes tailored to your startup
                  stage. Get started faster with proven frameworks.
                </p>
                <div className="flex items-center gap-2 text-sm font-medium text-purple-600 dark:text-purple-400">
                  Browse templates
                  <ArrowRight className="size-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      <Card className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border-amber-200 dark:border-amber-800">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg mt-0.5">
              <Sparkles className="size-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                {"💡 Pro Tip for Week "}
                {weekNumber}
              </h4>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                {getWeeklyTip(weekNumber)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
function getWeeklyTip(weekNumber) {
  const tips = [
    "Start with your most important outcome first. Everything else can wait.",
    "Break down big goals into bite-sized tasks. Small wins build momentum.",
    "Review your progress daily. 15 minutes of reflection prevents days of wasted effort.",
    "Focus on completing tasks, not starting them. Finished is better than perfect.",
    "Blocked on something? Don't wait - mark it as blocked and move forward on other tasks.",
    "Your weekly outcome should be ambitious but achievable. Stretch, don't break.",
    "Assign tasks to team members early. Clear ownership = faster execution.",
    "Track dependencies between tasks. Some things need to happen before others can start.",
    "Celebrate small wins with your team. Recognition fuels motivation.",
    "Don't let perfect be the enemy of good. Ship, learn, iterate.",
  ];
  return tips[(weekNumber - 1) % tips.length];
}
