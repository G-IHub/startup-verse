import React from "react";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import {
  Users,
  BarChart3,
  Target,
  Trophy,
  CheckCircle2,
  ArrowRight,
  TrendingUp,
  Calendar,
  MessageSquare,
  FileText,
  Award,
} from "lucide-react";
export function AcceleratorLandingPage({ onGetStarted, onBack }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-[#2ECC71]/5">
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
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#2ECC71]/10 border border-[#2ECC71]/20 mb-6">
            <Trophy className="w-4 h-4 text-[#2ECC71]" />
            <span className="text-sm font-semibold text-[#2ECC71]">
              For Accelerators & Programs
            </span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            The Operating System for
            <br />
            Startup Execution
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Track execution, measure progress, and drive accountability across
            your entire startup portfolio with real-time insights.
          </p>
          <Button
            onClick={onGetStarted}
            size="lg"
            className="h-14 px-10 text-lg bg-[#2ECC71] hover:bg-[#27AE60] text-white"
          >
            Get Started
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
          <p className="text-sm text-muted-foreground mt-4">
            Trusted by accelerators • Used by 100+ founders
          </p>
        </div>
        <div className="max-w-6xl mx-auto mb-20">
          <h2 className="text-3xl font-bold text-center mb-12">
            Built for Programs
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-2 border-primary/20 hover:border-primary/40 transition-all">
              <CardContent className="p-6">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2">Cohort Management</h3>
                <p className="text-muted-foreground mb-4">
                  Organize startups into cohorts, assign milestones, and track
                  progress across your entire portfolio.
                </p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#2ECC71] mt-0.5 flex-shrink-0" />
                    <span>Multi-cohort support</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#2ECC71] mt-0.5 flex-shrink-0" />
                    <span>Bulk startup invites</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#2ECC71] mt-0.5 flex-shrink-0" />
                    <span>Role-based access</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
            <Card className="border-2 border-[#2ECC71]/20 hover:border-[#2ECC71]/40 transition-all">
              <CardContent className="p-6">
                <div className="w-12 h-12 rounded-full bg-[#2ECC71]/10 flex items-center justify-center mb-4">
                  <BarChart3 className="w-6 h-6 text-[#2ECC71]" />
                </div>
                <h3 className="text-xl font-bold mb-2">Execution Analytics</h3>
                <p className="text-muted-foreground mb-4">
                  Real-time execution scores and insights help you identify
                  which startups need support.
                </p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>Portfolio dashboard</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>Weekly execution scores</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>Outcome tracking</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
            <Card className="border-2 border-primary/20 hover:border-primary/40 transition-all">
              <CardContent className="p-6">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Target className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2">Structured Programs</h3>
                <p className="text-muted-foreground mb-4">
                  Create custom milestones and deliverables for your program
                  curriculum.
                </p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#2ECC71] mt-0.5 flex-shrink-0" />
                    <span>Custom milestones</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#2ECC71] mt-0.5 flex-shrink-0" />
                    <span>Deliverable tracking</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#2ECC71] mt-0.5 flex-shrink-0" />
                    <span>Progress visibility</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
        <div className="max-w-5xl mx-auto mb-20">
          <h2 className="text-3xl font-bold text-center mb-12">
            Everything You Need
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="flex items-start gap-4 p-6 rounded-lg border border-border bg-card">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <MessageSquare className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Communication Center</h3>
                <p className="text-sm text-muted-foreground">
                  Broadcast announcements, share resources, and message
                  individual startups
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-6 rounded-lg border border-border bg-card">
              <div className="w-10 h-10 rounded-full bg-[#2ECC71]/10 flex items-center justify-center flex-shrink-0">
                <Calendar className="w-5 h-5 text-[#2ECC71]" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Event Management</h3>
                <p className="text-sm text-muted-foreground">
                  Schedule office hours, demo days, and workshops with
                  integrated calendar
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-6 rounded-lg border border-border bg-card">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <FileText className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Resource Library</h3>
                <p className="text-sm text-muted-foreground">
                  Share templates, guides, and learning materials with your
                  portfolio
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-6 rounded-lg border border-border bg-card">
              <div className="w-10 h-10 rounded-full bg-[#2ECC71]/10 flex items-center justify-center flex-shrink-0">
                <Award className="w-5 h-5 text-[#2ECC71]" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Mentor Network</h3>
                <p className="text-sm text-muted-foreground">
                  Assign mentors to startups and track mentor engagement
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-6 rounded-lg border border-border bg-card">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Performance Insights</h3>
                <p className="text-sm text-muted-foreground">
                  Identify high-performers and startups that need additional
                  support
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-6 rounded-lg border border-border bg-card">
              <div className="w-10 h-10 rounded-full bg-[#2ECC71]/10 flex items-center justify-center flex-shrink-0">
                <Users className="w-5 h-5 text-[#2ECC71]" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Team Visibility</h3>
                <p className="text-sm text-muted-foreground">
                  See team composition, role distribution, and collaboration
                  patterns
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="max-w-4xl mx-auto mb-20">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                1
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-1">
                  Create Your Organization
                </h3>
                <p className="text-muted-foreground">
                  Set up your accelerator or program with custom branding and
                  settings
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                2
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-1">
                  Invite Your Cohort
                </h3>
                <p className="text-muted-foreground">
                  Send bulk invitations to startups and have them join
                  automatically
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                3
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-1">
                  Define Milestones
                </h3>
                <p className="text-muted-foreground">
                  Create custom program milestones and deliverables for your
                  curriculum
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                4
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-1">Track & Support</h3>
                <p className="text-muted-foreground">
                  Monitor execution in real-time and provide support where it's
                  needed most
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="max-w-3xl mx-auto">
          <Card className="border-2 border-[#2ECC71]/20 bg-gradient-to-br from-[#2ECC71]/5 to-primary/5">
            <CardContent className="p-8 md:p-12 text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Ready to Transform Your Program?
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Join accelerators using StartupVerse to drive execution and
                measure real progress
              </p>
              <Button
                onClick={onGetStarted}
                size="lg"
                className="h-14 px-10 text-lg bg-[#2ECC71] hover:bg-[#27AE60] text-white mb-4"
              >
                Get Started Now
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <p className="text-sm text-muted-foreground">
                Start free • Add your first cohort in minutes
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
