import React from "react";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import {
  Lightbulb,
  Users,
  Target,
  Rocket,
  CheckCircle2,
  ArrowRight,
  ChevronRight,
  Sparkles,
} from "lucide-react";
export function AspiringFounderLandingPage({ onStartJourney, onBack }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <nav className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={onBack}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              ← Back
            </button>
            <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-[#2ECC71] bg-clip-text text-transparent">
              StartupVerse
            </h1>
            <div className="w-16" />
          </div>
        </div>
      </nav>
      <div className="container mx-auto px-4 py-12 md:py-20">
        <div className="max-w-4xl mx-auto text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-primary">
              For Aspiring Founders
            </span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Turn Your Startup Idea
            <br />
            Into Reality
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Get the structure, guidance, and accountability you need to validate
            your idea and build your first MVP—all in 12 weeks.
          </p>
          <Button
            onClick={onStartJourney}
            size="lg"
            className="h-14 px-10 text-lg bg-primary hover:bg-primary/90"
          >
            Start Your Founder Journey
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
          <p className="text-sm text-muted-foreground mt-4">
            Join StartupVerse Cohort 1 • Free to start
          </p>
        </div>
        <div className="max-w-5xl mx-auto mb-20">
          <h2 className="text-3xl font-bold text-center mb-12">
            Your 12-Week Journey
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="border-2 border-primary/20 hover:border-primary/40 transition-all">
              <CardContent className="p-6">
                <div className="flex items-start gap-4 mb-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Lightbulb className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <div className="text-sm text-primary font-semibold mb-1">
                      WEEKS 1-3
                    </div>
                    <h3 className="text-xl font-bold mb-2">
                      Ideation & Validation
                    </h3>
                  </div>
                </div>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <ChevronRight className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>Define your problem and target customer</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ChevronRight className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>Validate your idea through customer interviews</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ChevronRight className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>Refine your value proposition</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
            <Card className="border-2 border-[#2ECC71]/20 hover:border-[#2ECC71]/40 transition-all">
              <CardContent className="p-6">
                <div className="flex items-start gap-4 mb-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-[#2ECC71]/10 flex items-center justify-center">
                    <Users className="w-6 h-6 text-[#2ECC71]" />
                  </div>
                  <div>
                    <div className="text-sm text-[#2ECC71] font-semibold mb-1">
                      WEEKS 4-6
                    </div>
                    <h3 className="text-xl font-bold mb-2">Team Building</h3>
                  </div>
                </div>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <ChevronRight className="w-4 h-4 text-[#2ECC71] mt-0.5 flex-shrink-0" />
                    <span>Identify the skills you need</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ChevronRight className="w-4 h-4 text-[#2ECC71] mt-0.5 flex-shrink-0" />
                    <span>Find co-founders and early team members</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ChevronRight className="w-4 h-4 text-[#2ECC71] mt-0.5 flex-shrink-0" />
                    <span>Define roles and equity split</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
            <Card className="border-2 border-primary/20 hover:border-primary/40 transition-all">
              <CardContent className="p-6">
                <div className="flex items-start gap-4 mb-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Target className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <div className="text-sm text-primary font-semibold mb-1">
                      WEEKS 7-9
                    </div>
                    <h3 className="text-xl font-bold mb-2">
                      Product Development
                    </h3>
                  </div>
                </div>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <ChevronRight className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>Design your MVP (Minimum Viable Product)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ChevronRight className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>Build your first working prototype</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ChevronRight className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>Get early user feedback</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
            <Card className="border-2 border-[#2ECC71]/20 hover:border-[#2ECC71]/40 transition-all">
              <CardContent className="p-6">
                <div className="flex items-start gap-4 mb-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-[#2ECC71]/10 flex items-center justify-center">
                    <Rocket className="w-6 h-6 text-[#2ECC71]" />
                  </div>
                  <div>
                    <div className="text-sm text-[#2ECC71] font-semibold mb-1">
                      WEEKS 10-12
                    </div>
                    <h3 className="text-xl font-bold mb-2">Launch & Iterate</h3>
                  </div>
                </div>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <ChevronRight className="w-4 h-4 text-[#2ECC71] mt-0.5 flex-shrink-0" />
                    <span>Launch to your first 10 customers</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ChevronRight className="w-4 h-4 text-[#2ECC71] mt-0.5 flex-shrink-0" />
                    <span>Measure product-market fit signals</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ChevronRight className="w-4 h-4 text-[#2ECC71] mt-0.5 flex-shrink-0" />
                    <span>Plan your next growth phase</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
        <div className="max-w-4xl mx-auto mb-20">
          <h2 className="text-3xl font-bold text-center mb-12">What You Get</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-6 h-6 text-[#2ECC71] mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold mb-1">
                  Structured Weekly Framework
                </h3>
                <p className="text-sm text-muted-foreground">
                  7-step execution loop keeps you focused on weekly outcomes
                  that drive progress
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-6 h-6 text-[#2ECC71] mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold mb-1">Smart Team Matching</h3>
                <p className="text-sm text-muted-foreground">
                  Find co-founders and team members who complement your skills
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-6 h-6 text-[#2ECC71] mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold mb-1">Virtual Office</h3>
                <p className="text-sm text-muted-foreground">
                  Collaborate with your team through video calls, messaging, and
                  task management
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-6 h-6 text-[#2ECC71] mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold mb-1">Progress Tracking</h3>
                <p className="text-sm text-muted-foreground">
                  See your execution score and celebrate wins as you hit
                  milestones
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-6 h-6 text-[#2ECC71] mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold mb-1">Community Support</h3>
                <p className="text-sm text-muted-foreground">
                  Join Cohort 1 and connect with fellow founders on the same
                  journey
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-6 h-6 text-[#2ECC71] mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold mb-1">Accountability System</h3>
                <p className="text-sm text-muted-foreground">
                  Weekly check-ins and execution tracking keep you moving
                  forward
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="max-w-3xl mx-auto">
          <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-[#2ECC71]/5">
            <CardContent className="p-8 md:p-12 text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Ready to Turn Your Idea Into a Startup?
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Join StartupVerse Cohort 1 and start your 12-week journey today
              </p>
              <Button
                onClick={onStartJourney}
                size="lg"
                className="h-14 px-10 text-lg bg-primary hover:bg-primary/90 mb-4"
              >
                Start Your Journey Now
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <p className="text-sm text-muted-foreground">
                Free to start • No credit card required • Join 100+ founders
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
      <footer className="border-t border-border/50 mt-20">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-sm text-muted-foreground">
            © 2026 StartupVerse. The Operating System for Startup Execution.
          </div>
        </div>
      </footer>
    </div>
  );
}
