import React from "react";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import {
  Lightbulb,
  Rocket,
  Target,
  Users,
  TrendingUp,
  CheckCircle2,
  ArrowRight,
  BarChart3,
  Calendar,
  Trophy,
} from "lucide-react";
export function DualPathHomePage({
  onAspiringPath,
  onExecutionPath,
  onAcceleratorPath,
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto px-4 py-12 md:py-20">
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-primary to-[#2ECC71] bg-clip-text text-transparent">
            StartupVerse
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground">
            Where Founders Turn Ideas Into Startups
          </p>
        </div>
        <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto mb-20">
          <Card className="group hover:shadow-2xl transition-all duration-300 border-2 hover:border-primary/50 bg-card/50 backdrop-blur-sm">
            <CardContent className="p-8 md:p-10">
              <div className="mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                  <Lightbulb className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-2xl md:text-3xl font-bold mb-2">
                  Just Starting?
                </h2>
                <p className="text-lg text-muted-foreground">
                  For aspiring founders with an idea
                </p>
              </div>
              <div className="space-y-4 mb-8">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-[#2ECC71] mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-semibold">Structured Guidance</p>
                    <p className="text-sm text-muted-foreground">
                      Step-by-step framework from idea to MVP
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-[#2ECC71] mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-semibold">Validate Your Idea</p>
                    <p className="text-sm text-muted-foreground">
                      Learn if your startup idea has potential
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-[#2ECC71] mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-semibold">Find Your Team</p>
                    <p className="text-sm text-muted-foreground">
                      Connect with co-founders and early team members
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-[#2ECC71] mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-semibold">Weekly Execution</p>
                    <p className="text-sm text-muted-foreground">
                      Build momentum with actionable weekly outcomes
                    </p>
                  </div>
                </div>
              </div>
              <Button
                onClick={onAspiringPath}
                className="w-full h-12 text-lg bg-primary hover:bg-primary/90 group-hover:scale-105 transition-transform"
              >
                Start Your Journey
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <p className="text-center text-sm text-muted-foreground mt-4">
                Free to start • No credit card required
              </p>
            </CardContent>
          </Card>
          <Card className="group hover:shadow-2xl transition-all duration-300 border-2 hover:border-[#2ECC71]/50 bg-card/50 backdrop-blur-sm">
            <CardContent className="p-8 md:p-10">
              <div className="mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#2ECC71]/10 mb-4">
                  <Rocket className="w-8 h-8 text-[#2ECC71]" />
                </div>
                <h2 className="text-2xl md:text-3xl font-bold mb-2">
                  Already Building?
                </h2>
                <p className="text-lg text-muted-foreground">
                  For execution-focused founders & accelerators
                </p>
              </div>
              <div className="space-y-4 mb-8">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-semibold">Track Execution</p>
                    <p className="text-sm text-muted-foreground">
                      Measure progress with weekly outcomes & tasks
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-semibold">Execution Intelligence</p>
                    <p className="text-sm text-muted-foreground">
                      Real-time scoring & insights on your progress
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-semibold">Stay Accountable</p>
                    <p className="text-sm text-muted-foreground">
                      7-step weekly execution loop keeps you on track
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-semibold">Manage Cohorts</p>
                    <p className="text-sm text-muted-foreground">
                      Perfect for accelerators & startup programs
                    </p>
                  </div>
                </div>
              </div>
              <Button
                onClick={onExecutionPath}
                className="w-full h-12 text-lg bg-[#2ECC71] hover:bg-[#27AE60] text-white group-hover:scale-105 transition-transform"
              >
                Join 12-Week Challenge
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button
                onClick={onAcceleratorPath}
                variant="outline"
                className="w-full h-10 mt-3 border-[#2ECC71] text-[#2ECC71] hover:bg-[#2ECC71]/10"
              >
                Run Your Program
              </Button>
            </CardContent>
          </Card>
        </div>
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary/10 border border-primary/20">
            <Trophy className="w-5 h-5 text-primary" />
            <span className="font-semibold">Join StartupVerse Cohort 1</span>
          </div>
        </div>
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            The Operating System for Startup Execution
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 mb-4">
                <Target className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">7-Step Weekly Loop</h3>
              <p className="text-muted-foreground">
                Structured execution framework that keeps you focused on
                outcomes, not just tasks
              </p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[#2ECC71]/10 mb-4">
                <BarChart3 className="w-7 h-7 text-[#2ECC71]" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Execution Score</h3>
              <p className="text-muted-foreground">
                Real-time metrics that measure your startup's execution velocity
                and progress
              </p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 mb-4">
                <Users className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Team Collaboration</h3>
              <p className="text-muted-foreground">
                Built for teams with smart matching, role management, and
                real-time coordination
              </p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[#2ECC71]/10 mb-4">
                <TrendingUp className="w-7 h-7 text-[#2ECC71]" />
              </div>
              <h3 className="text-xl font-semibold mb-2">
                Outcome-Based Progress
              </h3>
              <p className="text-muted-foreground">
                Focus on results that matter - from idea validation to
                product-market fit
              </p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 mb-4">
                <Calendar className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Virtual Office</h3>
              <p className="text-muted-foreground">
                Integrated workspace with video calls, messaging, and agenda
                management
              </p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[#2ECC71]/10 mb-4">
                <Trophy className="w-7 h-7 text-[#2ECC71]" />
              </div>
              <h3 className="text-xl font-semibold mb-2">For Programs</h3>
              <p className="text-muted-foreground">
                Accelerators can track execution across entire cohorts with
                analytics
              </p>
            </div>
          </div>
        </div>
        <div className="max-w-4xl mx-auto mt-20 text-center">
          <div className="bg-gradient-to-r from-primary/10 via-[#2ECC71]/10 to-primary/10 rounded-2xl p-8 md:p-12 border border-primary/20">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Start Building?
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Join founders who are turning their ideas into reality
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={onAspiringPath}
                size="lg"
                className="h-12 px-8 bg-primary hover:bg-primary/90"
              >
                I Have An Idea
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button
                onClick={onExecutionPath}
                size="lg"
                className="h-12 px-8 bg-[#2ECC71] hover:bg-[#27AE60] text-white"
              >
                I'm Executing
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
      <footer className="border-t border-border/50 mt-20">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">
              © 2026 StartupVerse. The Operating System for Startup Execution.
            </p>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <a href="#" className="hover:text-primary transition-colors">
                About
              </a>
              <a href="#" className="hover:text-primary transition-colors">
                Blog
              </a>
              <a href="#" className="hover:text-primary transition-colors">
                Contact
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
