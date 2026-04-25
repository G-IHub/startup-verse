import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
  Sparkles,
  X,
  ChevronRight,
  MessageSquare,
  Target,
  UserPlus,
  CheckCircle2,
} from "lucide-react";
export default function Phase3Welcome({ onDismiss, onStartFlow }) {
  const currentStep = {
    icon: UserPlus,
    title: "Assign Tasks to Your Team",
    description:
      "Every task can be assigned to team members with one click. Track who's doing what!",
    color: "text-orange-600",
    bgColor: "bg-orange-50 dark:bg-orange-950/20",
  };
  const Icon = currentStep.icon;
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-lg flex items-center justify-center z-50 p-8 animate-in fade-in">
      <div className="w-full max-w-4xl mx-auto flex items-center justify-center min-h-[80vh]">
        <Card className="w-full shadow-2xl border-0 bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 rounded-2xl overflow-hidden">
          <CardHeader className="border-b border-border/20 bg-gradient-to-r from-transparent to-gray-50/50 dark:to-gray-800/50 px-8 py-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <Badge
                    variant="outline"
                    className="bg-gradient-to-r from-purple-500/20 to-purple-600/20 text-purple-700 border-purple-300 px-3 py-1 text-sm font-semibold"
                  >
                    Phase 3 Complete
                  </Badge>
                </div>
              </div>
              <CardTitle className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                {currentStep.title}
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={onDismiss} className="hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg p-2">
                <X className="w-5 h-5" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-10">
            <div
              className={`w-24 h-24 rounded-full ${currentStep.bgColor} flex items-center justify-center mx-auto mb-8 shadow-lg ring-4 ring-white/20 dark:ring-gray-800/20`}
            >
              <Icon className={`w-12 h-12 ${currentStep.color} drop-shadow-md`} />
            </div>
          <p className="text-center text-xl text-muted-foreground mb-8 leading-relaxed max-w-md mx-auto">
            {currentStep.description}
          </p>
                    <div className="p-6 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-indigo-900/20 dark:via-purple-900/20 dark:to-pink-900/20 rounded-xl border border-purple-200/30 shadow-xl mb-8">
              <h4 className="font-bold text-lg mb-4 flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
                <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">What's Included:</span>
              </h4>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                <div className="flex items-start gap-3 p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg">
                  <div className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 mt-2 shadow-md" />
                  <span className="font-medium">Natural language input</span>
                </div>
                <div className="flex items-start gap-3 p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg">
                  <div className="w-2 h-2 rounded-full bg-gradient-to-r from-green-500 to-blue-500 mt-2 shadow-md" />
                  <span className="font-medium">AI intent parsing</span>
                </div>
                <div className="flex items-start gap-3 p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg">
                  <div className="w-2 h-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 mt-2 shadow-md" />
                  <span className="font-medium">Auto-generated milestones</span>
                </div>
                <div className="flex items-start gap-3 p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg">
                  <div className="w-2 h-2 rounded-full bg-gradient-to-r from-orange-500 to-red-500 mt-2 shadow-md" />
                  <span className="font-medium">Smart task creation</span>
                </div>
                <div className="flex items-start gap-3 p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg">
                  <div className="w-2 h-2 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 mt-2 shadow-md" />
                  <span className="font-medium">Progress tracking</span>
                </div>
                <div className="flex items-start gap-3 p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg">
                  <div className="w-2 h-2 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 mt-2 shadow-md" />
                  <span className="font-medium">Weekly streak tracking</span>
                </div>
                <div className="flex items-start gap-3 p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg">
                  <div className="w-2 h-2 rounded-full bg-gradient-to-r from-yellow-500 to-orange-500 mt-2 shadow-md" />
                  <span className="font-medium">20 outcome templates</span>
                </div>
                <div className="flex items-start gap-3 p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg">
                  <div className="w-2 h-2 rounded-full bg-gradient-to-r from-teal-500 to-green-500 mt-2 shadow-md" />
                  <span className="font-medium">Team assignment</span>
                </div>
              </div>
            </div>
          <div className="flex gap-4 mt-6">
            <Button
              variant="outline"
              onClick={onDismiss}
              className="flex-1 border-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 shadow-sm"
            >
              I'll Explore Later
            </Button>
            <Button
              onClick={() => {
                onDismiss();
                onStartFlow();
              }}
              className="flex-1 bg-gradient-to-r from-indigo-500 via-purple-600 to-pink-600 hover:from-indigo-600 hover:via-purple-700 hover:to-pink-700 shadow-xl transform hover:scale-105 transition-all duration-300 font-semibold"
            >
              <Sparkles className="w-5 h-5 mr-3 animate-pulse" />
              Try It Now!
            </Button>
          </div>
          <p className="text-center text-xs text-muted-foreground mt-4">
              💡 Try saying: "Validate our pricing with 10 customer interviews"
            </p>
        </CardContent>
      </Card>
    </div>
    </div>
  );
}
