/**
 * 12-WEEK EXECUTION CHALLENGE LANDING PAGE
 * Public marketing page to recruit founders for the challenge
 */
import React, { useState } from "react";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import {
  Target,
  TrendingUp,
  Users,
  Award,
  CheckCircle2,
  Calendar,
  Zap,
  Trophy,
  BarChart3,
  ArrowRight,
  Sparkles,
} from "lucide-react";
export default function ChallengeLandingPage({ onJoinChallenge }) {
  const [spotsLeft, setSpotsLeft] = useState(50); // TODO: Load from backend
  const [cohortStartDate] = useState("March 17, 2026");
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5">
      <section className="relative px-6 pt-20 pb-16">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-6">
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-medium">
              Cohort 1 • Free for Founding Members
            </span>
          </div>
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 bg-gradient-to-r from-primary via-primary to-secondary bg-clip-text text-transparent">
            The 12-Week Execution Challenge
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto mb-8">
            {"Join 50 founders building "}
            <span className="text-foreground font-semibold">
              execution discipline
            </span>
            .<br />
            Track outcomes. Build momentum. Get results.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-6">
            <Button
              size="lg"
              className="text-lg px-8 py-6 h-auto"
              onClick={onJoinChallenge}
            >
              Join Cohort 1 - Free
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="text-lg px-8 py-6 h-auto"
              onClick={() => {
                document.getElementById("how-it-works")?.scrollIntoView({
                  behavior: "smooth",
                });
              }}
            >
              Learn More
            </Button>
          </div>
          <div className="flex flex-wrap gap-6 justify-center items-center text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" />
              <span>
                {"Starting "}
                <strong className="text-foreground">{cohortStartDate}</strong>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              <span>
                <strong className="text-foreground">{spotsLeft}</strong>
                {" spots available"}
              </span>
            </div>
          </div>
        </div>
      </section>
      <section className="px-6 py-12 bg-card/50 border-y">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">12</div>
              <div className="text-sm text-muted-foreground">
                Weeks of Execution
              </div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">50</div>
              <div className="text-sm text-muted-foreground">
                Founders in Cohort
              </div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">100%</div>
              <div className="text-sm text-muted-foreground">
                Free (Cohort 1)
              </div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">
                Top 10%
              </div>
              <div className="text-sm text-muted-foreground">Get Featured</div>
            </div>
          </div>
        </div>
      </section>
      <section id="how-it-works" className="px-6 py-20">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              How It Works
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              A proven execution framework used by top accelerators
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-2">
              <CardHeader>
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Target className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>Week 1-12: Execute</CardTitle>
                <CardDescription>
                  Each week, set 1-3 execution outcomes that move your startup
                  forward
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>Set weekly outcomes (not just tasks)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>Track progress daily</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>Complete & reflect on results</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
            <Card className="border-2">
              <CardHeader>
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <BarChart3 className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>Track Your Score</CardTitle>
                <CardDescription>
                  Get an Execution Score (0-100) benchmarked against other
                  founders
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>See your percentile ranking</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>Improve weekly with feedback</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>Compare to top performers</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
            <Card className="border-2">
              <CardHeader>
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Trophy className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>Win Recognition</CardTitle>
                <CardDescription>
                  Top 10% get featured, investor intros, and proof of execution
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>Featured in success stories</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>Warm intros to investors</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>Execution track record</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
      <section className="px-6 py-20 bg-card/30">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              What You Get
            </h2>
            <p className="text-lg text-muted-foreground">
              Everything you need to build execution discipline
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-primary" />
                  7-Step Weekly Execution Engine
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Proven framework: Intention → Planning → Execution → Review →
                Learn → Progress
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  Execution Score & Benchmarking
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                See how you rank vs other founders at your stage
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  Cohort Community
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Execute alongside 50 other ambitious founders
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-primary" />
                  Top Performer Recognition
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Get featured + investor intros if you're in top 10%
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
      <section className="px-6 py-20">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6">
            <Target className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-6">The Promise</h2>
          <p className="text-xl text-muted-foreground mb-8">
            {'"If you use StartupVerse for 12 weeks, '}
            <span className="text-foreground font-semibold">
              you will execute better than 90% of founders
            </span>
            ."
          </p>
          <p className="text-sm text-muted-foreground mb-8">
            This isn't about tools. It's about building the execution discipline
            that separates successful startups from failed ones.
          </p>
          <Button
            size="lg"
            className="text-lg px-8 py-6 h-auto"
            onClick={onJoinChallenge}
          >
            Join Cohort 1 - Free
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </div>
      </section>
      <section className="px-6 py-20 bg-card/30">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Who This Is For
            </h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="border-2 border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-primary">
                  <CheckCircle2 className="w-5 h-5" />
                  Perfect For
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li>✅ Pre-seed to seed stage founders</li>
                  <li>✅ Solo founders or small teams (1-5 people)</li>
                  <li>✅ B2B SaaS, marketplace, or tech startups</li>
                  <li>✅ Founders who struggle with execution discipline</li>
                  <li>✅ Anyone wanting to prove traction faster</li>
                </ul>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-muted-foreground">
                  Not Ideal For
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>❌ Just exploring ideas (not committed yet)</li>
                  <li>❌ Can't dedicate 10+ hours/week to startup</li>
                  <li>❌ Looking for a magic bullet or shortcuts</li>
                  <li>❌ Not willing to track progress weekly</li>
                  <li>❌ Already executing at high level consistently</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
      <section className="px-6 py-20">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">FAQ</h2>
          </div>
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Is Cohort 1 really free?
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Yes! Cohort 1 is completely free. We're gathering data and
                testimonials. Future cohorts will be $49/month.
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  What's the time commitment?
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                15-30 minutes per week to set outcomes and update progress. The
                rest is working on your startup (which you're already doing).
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  What if I miss a week?
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Life happens! Just jump back in the next week. Your Execution
                Score will reflect consistency, but you can still complete the
                challenge.
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  How is this different from productivity tools?
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                This isn't about tasks—it's about outcomes. We track what
                actually moves your startup forward, not just busy work. Plus,
                you're benchmarked against other founders.
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  What happens after 12 weeks?
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                You'll have an Execution Score, proof of your execution
                capability, and (if you're top 10%) investor intros. You can
                continue using StartupVerse or export your data.
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
      <section className="px-6 py-20 bg-gradient-to-r from-primary/10 via-primary/5 to-secondary/10">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            {"Join "}
            {50 - spotsLeft}
            {" Founders Already Signed Up"}
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            {"Cohort 1 starts "}
            {cohortStartDate}
            {". Only "}
            {spotsLeft}
            {" spots left."}
          </p>
          <Button
            size="lg"
            className="text-lg px-8 py-6 h-auto"
            onClick={onJoinChallenge}
          >
            Claim Your Spot - Free
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
          <p className="text-sm text-muted-foreground mt-6">
            No credit card required • Takes 2 minutes
          </p>
        </div>
      </section>
      <footer className="px-6 py-8 border-t text-center text-sm text-muted-foreground">
        <p>© 2026 StartupVerse. The Operating System for Startup Execution.</p>
      </footer>
    </div>
  );
}
