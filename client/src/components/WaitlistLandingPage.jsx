import { useState } from "react";
import {
  ArrowRight,
  Check,
  Rocket,
  Users,
  Video,
  Map,
  Sparkles,
  Zap,
  DollarSign,
  Clock,
  Shield,
  TrendingUp,
  MessageSquare,
  Calendar,
  Target,
  Star,
  CheckCircle2,
  Gift,
} from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
export default function WaitlistLandingPage() {
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: Connect to backend/email service
    console.log("Waitlist signup:", email);
    setIsSubmitted(true);

    // Reset after 5 seconds
    setTimeout(() => {
      setIsSubmitted(false);
      setEmail("");
    }, 5000);
  };
  return (
    <div className="min-h-screen bg-background">
      <section className="relative overflow-hidden bg-gradient-to-br from-[#3A5AFE]/5 via-background to-[#2ECC71]/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8 text-center lg:text-left">
              <div className="flex justify-center lg:justify-start">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#3A5AFE] to-[#2ECC71] flex items-center justify-center shadow-lg">
                  <Rocket className="w-10 h-10 text-white" />
                </div>
              </div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#3A5AFE]/10 text-[#3A5AFE] border border-[#3A5AFE]/20">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#3A5AFE] opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#3A5AFE]" />
                </span>
                <span>Launching Soon - Join the Waitlist</span>
              </div>
              <div className="space-y-4">
                <h1 className="text-5xl md:text-7xl">
                  Everything You Need to
                  <br />
                  <span className="bg-gradient-to-r from-[#3A5AFE] to-[#2ECC71] bg-clip-text text-transparent">
                    Build Your Startup
                  </span>
                </h1>
                <p className="text-xl md:text-2xl text-muted-foreground">
                  From idea to growth, StartupVerse helps founders execute with
                  clarity—aligning teams, tracking progress, and building
                  momentum week by week.
                </p>
              </div>
              {isSubmitted ? (
                <div className="bg-[#2ECC71]/10 border border-[#2ECC71]/20 rounded-2xl p-8 space-y-3 animate-in fade-in slide-in-from-bottom-4">
                  <div className="w-16 h-16 rounded-full bg-[#2ECC71] flex items-center justify-center mx-auto lg:mx-0">
                    <Check className="w-8 h-8 text-white" />
                  </div>
                  <h2 className="text-2xl">You're on the waitlist!</h2>
                  <p className="text-muted-foreground">
                    Check your email for confirmation. We'll notify you when we
                    launch with exclusive early access perks.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  <form onSubmit={handleSubmit}>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your email"
                        required={true}
                        className="flex-1 px-6 py-4 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#3A5AFE] focus:border-transparent transition-all"
                      />
                      <button
                        type="submit"
                        className="px-8 py-4 rounded-xl bg-[#3A5AFE] text-white hover:bg-[#2948CC] transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 group whitespace-nowrap"
                      >
                        <span>Join Waitlist</span>
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                      </button>
                    </div>
                  </form>
                  <div className="flex items-center justify-center lg:justify-start gap-6 text-sm text-muted-foreground flex-wrap">
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-[#2ECC71]" />
                      <span>Early access perks</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-[#2ECC71]" />
                      <span>Exclusive founding member benefits</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-[#2ECC71]" />
                      <span>No spam, unsubscribe anytime</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="relative">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                <ImageWithFallback
                  src="https://images.unsplash.com/photo-1758873268663-5a362616b5a7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdGFydHVwJTIwdGVhbSUyMGNvbGxhYm9yYXRpb24lMjB3b3Jrc3BhY2V8ZW58MXx8fHwxNzY0OTI4MDAwfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                  alt="Startup team collaborating"
                  className="w-full h-[500px] object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/50 to-transparent" />
              </div>
            </div>
          </div>
          <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto lg:mx-0">
            <div className="space-y-2 text-center lg:text-left">
              <div className="flex items-center justify-center lg:justify-start gap-2">
                <Users className="w-5 h-5 text-[#3A5AFE]" />
                <span className="text-3xl">500+</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Founders on waitlist
              </p>
            </div>
            <div className="space-y-2 text-center lg:text-left">
              <div className="flex items-center justify-center lg:justify-start gap-2">
                <DollarSign className="w-5 h-5 text-[#2ECC71]" />
                <span className="text-3xl">$500</span>
              </div>
              <p className="text-sm text-muted-foreground">Saved per month</p>
            </div>
            <div className="space-y-2 text-center lg:text-left">
              <div className="flex items-center justify-center lg:justify-start gap-2">
                <Clock className="w-5 h-5 text-[#3A5AFE]" />
                <span className="text-3xl">10+</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Hours saved weekly
              </p>
            </div>
          </div>
        </div>
      </section>
      <section className="py-20 bg-gradient-to-br from-[#2ECC71]/10 via-background to-[#3A5AFE]/10 border-y border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="relative p-8 md:p-12 rounded-3xl bg-gradient-to-br from-[#3A5AFE] to-[#2ECC71] text-white shadow-2xl overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
              <div className="relative z-10 text-center space-y-6">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm">
                  <Gift className="w-5 h-5" />
                  <span>Limited Time Offer - Waitlist Members Only</span>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-center gap-4">
                    <div className="text-6xl md:text-8xl line-through opacity-60">
                      $49
                    </div>
                    <div className="text-8xl md:text-9xl">$0</div>
                  </div>
                  <h2 className="text-3xl md:text-5xl">
                    Free Early Access for Waitlist Members
                  </h2>
                  <p className="text-xl md:text-2xl text-white/90 max-w-2xl mx-auto">
                    Join the waitlist now and get 3 months completely free when
                    we launch, then lock in 50% founding member pricing forever.
                  </p>
                </div>
                <div className="grid md:grid-cols-3 gap-6 pt-6">
                  <div className="p-6 rounded-xl bg-white/10 backdrop-blur-sm space-y-2">
                    <div className="text-4xl">$0</div>
                    <div className="text-lg">First 3 Months</div>
                    <div className="text-sm text-white/80">
                      Normally $147 value
                    </div>
                  </div>
                  <div className="p-6 rounded-xl bg-white/10 backdrop-blur-sm space-y-2">
                    <div className="text-4xl">$24</div>
                    <div className="text-lg">After That (Forever)</div>
                    <div className="text-sm text-white/80">
                      50% off regular price
                    </div>
                  </div>
                  <div className="p-6 rounded-xl bg-white/10 backdrop-blur-sm space-y-2">
                    <div className="text-4xl">$300</div>
                    <div className="text-lg">Yearly Savings</div>
                    <div className="text-sm text-white/80">
                      Founding member benefit
                    </div>
                  </div>
                </div>
                <div className="pt-6">
                  <div className="inline-flex items-center gap-2 text-lg">
                    <CheckCircle2 className="w-6 h-6" />
                    <span>No credit card required to join waitlist</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-4xl md:text-5xl">
              The Startup Struggle is Real
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Building a startup shouldn't mean juggling 5+ tools and struggling
              to find the right team.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <div className="p-8 rounded-2xl bg-red-500/5 border border-red-500/20">
              <h3 className="text-2xl mb-4 text-red-500">❌ The Old Way</h3>
              <ul className="space-y-3 text-muted-foreground">
                <li className="flex items-start gap-3">
                  <span className="text-red-500 mt-1">•</span>
                  <span>
                    Paying $500+/month for Slack, Zoom, Notion, Linear, Loom
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-red-500 mt-1">•</span>
                  <span>
                    Wasting weeks searching for co-founders on random platforms
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-red-500 mt-1">•</span>
                  <span>
                    No clear roadmap - just Googling "how to start a startup"
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-red-500 mt-1">•</span>
                  <span>Switching between 10 tabs just to get work done</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-red-500 mt-1">•</span>
                  <span>
                    Team collaboration feels scattered and disconnected
                  </span>
                </li>
              </ul>
            </div>
            <div className="p-8 rounded-2xl bg-[#2ECC71]/10 border border-[#2ECC71]/20">
              <h3 className="text-2xl mb-4 text-[#2ECC71]">
                ✓ The StartupVerse Way
              </h3>
              <ul className="space-y-3 text-muted-foreground">
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-[#2ECC71] mt-1 flex-shrink-0" />
                  <span>
                    One platform replaces 5 tools - save $500/month instantly
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-[#2ECC71] mt-1 flex-shrink-0" />
                  <span>
                    Algorithm-powered matching finds your perfect co-founder in
                    days
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-[#2ECC71] mt-1 flex-shrink-0" />
                  <span>
                    6-stage roadmap with 35+ tools guides you from idea to
                    growth
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-[#2ECC71] mt-1 flex-shrink-0" />
                  <span>
                    Everything in one unified workspace with built-in analytics
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-[#2ECC71] mt-1 flex-shrink-0" />
                  <span>
                    Immersive virtual office keeps your team connected 24/7
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-4xl md:text-5xl">
              Everything You Need to Build & Grow
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Six powerful features working together to accelerate your startup
              journey.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="p-8 rounded-2xl bg-gradient-to-br from-[#3A5AFE]/5 to-[#3A5AFE]/10 border border-[#3A5AFE]/20 space-y-4">
              <div className="w-14 h-14 rounded-xl bg-[#3A5AFE] flex items-center justify-center">
                <Sparkles className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-2xl">Smart Team Matching</h3>
              <p className="text-muted-foreground">
                Algorithm-powered matching finds co-founders and teammates based
                on skills, experience, timezone, and work style.
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#3A5AFE]" />
                  <span>Compatibility scoring algorithm</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#3A5AFE]" />
                  <span>Verified profiles and portfolios</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#3A5AFE]" />
                  <span>Built-in collaboration agreements</span>
                </li>
              </ul>
            </div>
            <div className="p-8 rounded-2xl bg-gradient-to-br from-[#2ECC71]/5 to-[#2ECC71]/10 border border-[#2ECC71]/20 space-y-4">
              <div className="w-14 h-14 rounded-xl bg-[#2ECC71] flex items-center justify-center">
                <Video className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-2xl">Virtual Office Workspace</h3>
              <p className="text-muted-foreground">
                Immersive workspace replaces Slack, Zoom, Notion, Linear, and
                Loom with unified interface and floating video.
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#2ECC71]" />
                  <span>Real-time collaboration and presence</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#2ECC71]" />
                  <span>Integrated video, chat, and tasks</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#2ECC71]" />
                  <span>No context switching between tools</span>
                </li>
              </ul>
            </div>
            <div className="p-8 rounded-2xl bg-gradient-to-br from-[#3A5AFE]/5 to-[#2ECC71]/10 border border-[#3A5AFE]/20 space-y-4">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#3A5AFE] to-[#2ECC71] flex items-center justify-center">
                <Map className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-2xl">Startup Journey Roadmap</h3>
              <p className="text-muted-foreground">
                Battle-tested 6-stage framework from ideation to growth with 35+
                purpose-built tools and step-by-step guidance.
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#3A5AFE]" />
                  <span>Step-by-step guidance for each stage</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#3A5AFE]" />
                  <span>35+ built-in tools and templates</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#3A5AFE]" />
                  <span>Progress tracking and milestones</span>
                </li>
              </ul>
            </div>
            <div className="p-8 rounded-2xl bg-gradient-to-br from-[#3A5AFE]/5 to-[#3A5AFE]/10 border border-[#3A5AFE]/20 space-y-4">
              <div className="w-14 h-14 rounded-xl bg-[#3A5AFE] flex items-center justify-center">
                <Target className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-2xl">Core Execution Engine</h3>
              <p className="text-muted-foreground">
                7-step weekly loop that converts your ideas into structured
                tasks, aligns your team, tracks completion automatically, and
                measures real progress with streak tracking.
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#3A5AFE]" />
                  <span>Weekly outcome translation system</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#3A5AFE]" />
                  <span>Automatic velocity & blocker tracking</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#3A5AFE]" />
                  <span>Weekly outcome streak retention</span>
                </li>
              </ul>
            </div>
            <div className="p-8 rounded-2xl bg-gradient-to-br from-[#2ECC71]/5 to-[#2ECC71]/10 border border-[#2ECC71]/20 space-y-4">
              <div className="w-14 h-14 rounded-xl bg-[#2ECC71] flex items-center justify-center">
                <DollarSign className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-2xl">Compensation Contracts</h3>
              <p className="text-muted-foreground">
                Set flexible compensation models with performance
                thresholds—equity vesting, hourly rates, or fixed payments all
                automated.
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#2ECC71]" />
                  <span>Equity vesting with cliff periods</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#2ECC71]" />
                  <span>Performance-gated payments</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#2ECC71]" />
                  <span>Automatic threshold tracking</span>
                </li>
              </ul>
            </div>
            <div className="p-8 rounded-2xl bg-gradient-to-br from-[#2ECC71]/5 to-[#3A5AFE]/10 border border-[#2ECC71]/20 space-y-4">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#2ECC71] to-[#3A5AFE] flex items-center justify-center">
                <Zap className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-2xl">All-in-One Platform</h3>
              <p className="text-muted-foreground">
                Everything integrated seamlessly—team matching flows into
                virtual office, journey roadmap guides daily work, all in one
                subscription.
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#2ECC71]" />
                  <span>Single sign-on, one platform</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#2ECC71]" />
                  <span>Unified data and insights</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#2ECC71]" />
                  <span>Save $500/month on subscriptions</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>
      <section className="py-20 bg-gradient-to-br from-[#3A5AFE]/5 via-background to-[#2ECC71]/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-4xl md:text-5xl">
              The 7-Step Weekly Execution Loop
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Our algorithm-powered system translates founder decisions into
              measurable team progress—automatically, every single week.
            </p>
          </div>
          <div className="grid md:grid-cols-4 lg:grid-cols-7 gap-4 mb-12">
            <div className="p-6 rounded-xl bg-background border border-[#3A5AFE]/20 space-y-3">
              <div className="text-3xl font-bold text-[#3A5AFE]">1</div>
              <div className="text-sm text-muted-foreground">Monday</div>
              <div className="text-lg">Set Weekly Outcome</div>
            </div>
            <div className="p-6 rounded-xl bg-background border border-[#3A5AFE]/20 space-y-3">
              <div className="text-3xl font-bold text-[#3A5AFE]">2</div>
              <div className="text-sm text-muted-foreground">Auto-Convert</div>
              <div className="text-lg">Milestones → Tasks</div>
            </div>
            <div className="p-6 rounded-xl bg-background border border-[#2ECC71]/20 space-y-3">
              <div className="text-3xl font-bold text-[#2ECC71]">3</div>
              <div className="text-sm text-muted-foreground">Assign Team</div>
              <div className="text-lg">Delegate tasks</div>
            </div>
            <div className="p-6 rounded-xl bg-background border border-[#2ECC71]/20 space-y-3">
              <div className="text-3xl font-bold text-[#2ECC71]">4</div>
              <div className="text-sm text-muted-foreground">
                Daily Execution
              </div>
              <div className="text-lg">Team builds</div>
            </div>
            <div className="p-6 rounded-xl bg-background border border-[#3A5AFE]/20 space-y-3">
              <div className="text-3xl font-bold text-[#3A5AFE]">5</div>
              <div className="text-sm text-muted-foreground">
                Track Progress
              </div>
              <div className="text-lg">Real-time analytics</div>
            </div>
            <div className="p-6 rounded-xl bg-background border border-[#3A5AFE]/20 space-y-3">
              <div className="text-3xl font-bold text-[#3A5AFE]">6</div>
              <div className="text-sm text-muted-foreground">Sunday Check</div>
              <div className="text-lg">Mark outcome</div>
            </div>
            <div className="p-6 rounded-xl bg-gradient-to-br from-[#3A5AFE] to-[#2ECC71] text-white space-y-3">
              <div className="text-3xl font-bold">7</div>
              <div className="text-sm opacity-90">Streak +1</div>
              <div className="text-lg">Build momentum</div>
            </div>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-8 rounded-2xl bg-background border border-border space-y-4">
              <div className="w-12 h-12 rounded-lg bg-[#3A5AFE]/10 flex items-center justify-center">
                <Target className="w-6 h-6 text-[#3A5AFE]" />
              </div>
              <h3 className="text-2xl">Weekly Streak</h3>
              <p className="text-muted-foreground">
                Primary retention metric—gamified consistency that builds
                momentum week after week. Hit your outcomes, grow your streak.
              </p>
            </div>
            <div className="p-8 rounded-2xl bg-background border border-border space-y-4">
              <div className="w-12 h-12 rounded-lg bg-[#2ECC71]/10 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-[#2ECC71]" />
              </div>
              <h3 className="text-2xl">Smart Contracts</h3>
              <p className="text-muted-foreground">
                Equity vesting and payments automatically tied to task
                completion rates—no spreadsheets, no manual tracking.
              </p>
            </div>
            <div className="p-8 rounded-2xl bg-background border border-border space-y-4">
              <div className="w-12 h-12 rounded-lg bg-[#3A5AFE]/10 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-[#3A5AFE]" />
              </div>
              <h3 className="text-2xl">Real Analytics</h3>
              <p className="text-muted-foreground">
                Velocity trends, blocker detection, and stage progression
                tracking—all updated automatically as your team works.
              </p>
            </div>
          </div>
        </div>
      </section>
      <section className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-4xl md:text-5xl">Why Join the Waitlist?</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Early access members get exclusive perks and founding member
              benefits.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="p-6 rounded-xl bg-background border border-border space-y-3">
              <div className="w-12 h-12 rounded-lg bg-[#3A5AFE]/10 flex items-center justify-center">
                <Star className="w-6 h-6 text-[#3A5AFE]" />
              </div>
              <h3 className="text-xl">Early Access</h3>
              <p className="text-sm text-muted-foreground">
                Be among the first to use StartupVerse before the public launch.
                Get a head start on building your team.
              </p>
            </div>
            <div className="p-6 rounded-xl bg-background border border-border space-y-3">
              <div className="w-12 h-12 rounded-lg bg-[#2ECC71]/10 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-[#2ECC71]" />
              </div>
              <h3 className="text-xl">Founding Member Pricing</h3>
              <p className="text-sm text-muted-foreground">
                Lock in special lifetime pricing - 50% off forever as a thank
                you for joining early.
              </p>
            </div>
            <div className="p-6 rounded-xl bg-background border border-border space-y-3">
              <div className="w-12 h-12 rounded-lg bg-[#3A5AFE]/10 flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-[#3A5AFE]" />
              </div>
              <h3 className="text-xl">Shape the Product</h3>
              <p className="text-sm text-muted-foreground">
                Direct access to founders, priority feature requests, and
                influence on product roadmap.
              </p>
            </div>
            <div className="p-6 rounded-xl bg-background border border-border space-y-3">
              <div className="w-12 h-12 rounded-lg bg-[#2ECC71]/10 flex items-center justify-center">
                <Shield className="w-6 h-6 text-[#2ECC71]" />
              </div>
              <h3 className="text-xl">Priority Support</h3>
              <p className="text-sm text-muted-foreground">
                Dedicated support channel, faster response times, and
                personalized onboarding assistance.
              </p>
            </div>
            <div className="p-6 rounded-xl bg-background border border-border space-y-3">
              <div className="w-12 h-12 rounded-lg bg-[#3A5AFE]/10 flex items-center justify-center">
                <Users className="w-6 h-6 text-[#3A5AFE]" />
              </div>
              <h3 className="text-xl">Exclusive Community</h3>
              <p className="text-sm text-muted-foreground">
                Join a private community of early adopters, founding members,
                and ambitious builders.
              </p>
            </div>
            <div className="p-6 rounded-xl bg-background border border-border space-y-3">
              <div className="w-12 h-12 rounded-lg bg-[#2ECC71]/10 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-[#2ECC71]" />
              </div>
              <h3 className="text-xl">First to Match</h3>
              <p className="text-sm text-muted-foreground">
                Get matched with other early adopters - the most motivated and
                serious founders on the platform.
              </p>
            </div>
          </div>
        </div>
      </section>
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-4xl md:text-5xl">Our Launch Timeline</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Here's what happens after you join the waitlist.
            </p>
          </div>
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="flex gap-6">
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-[#3A5AFE] flex items-center justify-center flex-shrink-0">
                  <Check className="w-6 h-6 text-white" />
                </div>
                <div className="w-0.5 h-full bg-[#3A5AFE]/20 mt-2" />
              </div>
              <div className="pb-8">
                <h3 className="text-xl mb-2">Today - Join Waitlist</h3>
                <p className="text-muted-foreground">
                  Sign up and receive immediate confirmation email with what to
                  expect next.
                </p>
              </div>
            </div>
            <div className="flex gap-6">
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-[#3A5AFE] flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
                <div className="w-0.5 h-full bg-[#3A5AFE]/20 mt-2" />
              </div>
              <div className="pb-8">
                <h3 className="text-xl mb-2">Week 1-2 - Beta Preview</h3>
                <p className="text-muted-foreground">
                  Get exclusive sneak peeks, demo videos, and behind-the-scenes
                  updates as we finalize the platform.
                </p>
              </div>
            </div>
            <div className="flex gap-6">
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-[#2ECC71] flex items-center justify-center flex-shrink-0">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div className="w-0.5 h-full bg-[#3A5AFE]/20 mt-2" />
              </div>
              <div className="pb-8">
                <h3 className="text-xl mb-2">Week 3 - Early Access Invites</h3>
                <p className="text-muted-foreground">
                  Receive your personal early access invitation with founding
                  member pricing and exclusive perks.
                </p>
              </div>
            </div>
            <div className="flex gap-6">
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-[#2ECC71] flex items-center justify-center flex-shrink-0">
                  <Rocket className="w-6 h-6 text-white" />
                </div>
              </div>
              <div>
                <h3 className="text-xl mb-2">Week 4+ - Public Launch</h3>
                <p className="text-muted-foreground">
                  Official launch to the public. Your founding member benefits
                  continue forever.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-4xl md:text-5xl">
              What Early Testers Are Saying
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              We've been testing with select founders. Here's what they think.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="p-6 rounded-xl bg-background border border-border space-y-4">
              <div className="flex gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className="w-5 h-5 fill-[#3A5AFE] text-[#3A5AFE]"
                  />
                ))}
              </div>
              <p className="text-muted-foreground">
                "Finally, a platform that gets it. I found my technical
                co-founder in 3 days and we're already shipping. Game changer."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#3A5AFE] to-[#2ECC71]" />
                <div>
                  <div>Sarah Chen</div>
                  <div className="text-sm text-muted-foreground">
                    Founder, TechFlow AI
                  </div>
                </div>
              </div>
            </div>
            <div className="p-6 rounded-xl bg-background border border-border space-y-4">
              <div className="flex gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className="w-5 h-5 fill-[#2ECC71] text-[#2ECC71]"
                  />
                ))}
              </div>
              <p className="text-muted-foreground">
                "We cancelled Slack, Zoom, and Notion. Saved $480/month and our
                team actually collaborates better now. Worth it."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#2ECC71] to-[#3A5AFE]" />
                <div>
                  <div>Marcus Rodriguez</div>
                  <div className="text-sm text-muted-foreground">
                    CEO, HealthKit
                  </div>
                </div>
              </div>
            </div>
            <div className="p-6 rounded-xl bg-background border border-border space-y-4">
              <div className="flex gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className="w-5 h-5 fill-[#3A5AFE] text-[#3A5AFE]"
                  />
                ))}
              </div>
              <p className="text-muted-foreground">
                "The journey roadmap alone is worth it. Went from confused
                first-time founder to clear execution plan in a week."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#3A5AFE] to-[#2ECC71]" />
                <div>
                  <div>Emma Thompson</div>
                  <div className="text-sm text-muted-foreground">
                    Founder, EcoMarket
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-4xl md:text-5xl">Frequently Asked Questions</h2>
          </div>
          <div className="space-y-6">
            <div className="p-6 rounded-xl bg-muted/50 border border-border space-y-2">
              <h3 className="text-xl">When will StartupVerse launch?</h3>
              <p className="text-muted-foreground">
                We're launching in 3-4 weeks! Waitlist members get early access
                1 week before public launch, so join now to be first in line.
              </p>
            </div>
            <div className="p-6 rounded-xl bg-muted/50 border border-border space-y-2">
              <h3 className="text-xl">How much will it cost?</h3>
              <p className="text-muted-foreground">
                Public pricing will start at $49/month for teams. But waitlist
                members lock in founding member pricing at $24/month (50% off) -
                forever. That's a $300/year savings.
              </p>
            </div>
            <div className="p-6 rounded-xl bg-muted/50 border border-border space-y-2">
              <h3 className="text-xl">What if I'm a solo founder right now?</h3>
              <p className="text-muted-foreground">
                Perfect! Use Smart Team Matching to find co-founders, then move
                together into the Virtual Office. The Journey Roadmap guides you
                even as a solo founder.
              </p>
            </div>
            <div className="p-6 rounded-xl bg-muted/50 border border-border space-y-2">
              <h3 className="text-xl">Can I really replace all my tools?</h3>
              <p className="text-muted-foreground">
                Yes! StartupVerse replaces Slack (messaging), Zoom (video),
                Notion (docs), Linear (tasks), and Loom (async video). One
                subscription, one workspace, everything integrated.
              </p>
            </div>
            <div className="p-6 rounded-xl bg-muted/50 border border-border space-y-2">
              <h3 className="text-xl">
                What industries/types of startups does this work for?
              </h3>
              <p className="text-muted-foreground">
                All of them! Whether you're building SaaS, e-commerce, hardware,
                or services - the framework and tools adapt to your specific
                needs. Works for pre-revenue ideas to growth-stage companies.
              </p>
            </div>
            <div className="p-6 rounded-xl bg-muted/50 border border-border space-y-2">
              <h3 className="text-xl">Is my data secure?</h3>
              <p className="text-muted-foreground">
                Absolutely. Enterprise-grade security, encrypted data, SOC 2
                compliant infrastructure. Your startup IP and conversations are
                completely private and protected.
              </p>
            </div>
            <div className="p-6 rounded-xl bg-muted/50 border border-border space-y-2">
              <h3 className="text-xl">
                How does the Core Execution Engine work?
              </h3>
              <p className="text-muted-foreground">
                The execution engine runs a 7-step weekly loop: (1) You describe
                what you want to accomplish, (2) The platform translates it into
                structured milestones and tasks, (3) Tasks get assigned to team
                members with deadlines, (4) Team works and marks progress, (5)
                System tracks completion rates and blockers automatically, (6)
                Weekly outcomes are measured (shipped vs missed), (7) Your
                outcome streak builds momentum. This keeps everyone aligned and
                accountable without spreadsheets or status meetings.
              </p>
            </div>
            <div className="p-6 rounded-xl bg-muted/50 border border-border space-y-2">
              <h3 className="text-xl">
                How does the compensation system work?
              </h3>
              <p className="text-muted-foreground">
                When you onboard team members, you can set flexible compensation
                models: Equity-Only (with vesting schedules), Hourly Rates
                (time-tracked), Fixed Payments (monthly/one-time), or Hybrid
                combinations. You define performance thresholds (like "complete
                80% of weekly tasks"), and the platform automatically tracks
                completion rates. When thresholds are met, equity vests and
                payments process—no spreadsheets or manual calculations
                required.
              </p>
            </div>
            <div className="p-6 rounded-xl bg-muted/50 border border-border space-y-2">
              <h3 className="text-xl">What analytics are included?</h3>
              <p className="text-muted-foreground">
                The platform includes real-time analytics that update
                automatically: Team Velocity (8-week task completion trends),
                Outcome Achievement tracking (completed vs missed weekly goals
                with streak counts), Blocker Detection (identifies patterns in
                stuck tasks), and Stage Progression (visualizes your journey
                through all 6 startup stages). All metrics are algorithm-powered
                with zero manual data entry.
              </p>
            </div>
            <div className="p-6 rounded-xl bg-muted/50 border border-border space-y-2">
              <h3 className="text-xl">What if I don't like it?</h3>
              <p className="text-muted-foreground">
                30-day money-back guarantee, no questions asked. Plus free
                migration assistance if you decide to switch back to your old
                tools.
              </p>
            </div>
          </div>
        </div>
      </section>
      <section className="py-20 bg-gradient-to-br from-[#3A5AFE]/10 via-background to-[#2ECC71]/10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
          <h2 className="text-4xl md:text-6xl">
            Ready to Build Your Startup
            <br />
            the Smart Way?
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Join 500+ founders on the waitlist. Get early access, founding
            member pricing, and exclusive perks.
          </p>
          {isSubmitted ? (
            <div className="bg-[#2ECC71]/10 border border-[#2ECC71]/20 rounded-2xl p-8 space-y-3 max-w-lg mx-auto">
              <div className="w-16 h-16 rounded-full bg-[#2ECC71] flex items-center justify-center mx-auto">
                <Check className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl">Welcome to StartupVerse!</h3>
              <p className="text-muted-foreground">
                Check your email for next steps. We'll keep you updated on our
                launch progress.
              </p>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="max-w-lg mx-auto space-y-4"
            >
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required={true}
                  className="flex-1 px-6 py-4 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#3A5AFE] focus:border-transparent transition-all text-lg"
                />
                <button
                  type="submit"
                  className="px-8 py-4 rounded-xl bg-[#3A5AFE] text-white hover:bg-[#2948CC] transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 group whitespace-nowrap text-lg"
                >
                  <span>Join Waitlist Free</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
              <p className="text-sm text-muted-foreground">
                🎉 Lock in 50% founding member discount · ⚡ Early access in 3
                weeks · 🚀 No credit card required
              </p>
            </form>
          )}
          <div className="pt-8 text-sm text-muted-foreground">
            {"Questions? Email us at "}
            <a
              href="mailto:hello@startupverse.com"
              className="text-[#3A5AFE] hover:underline"
            >
              hello@startupverse.com
            </a>
          </div>
        </div>
      </section>
      <footer className="py-12 border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#3A5AFE] to-[#2ECC71] flex items-center justify-center">
                <Rocket className="w-4 h-4 text-white" />
              </div>
              <span>StartupVerse</span>
            </div>
            <div className="text-sm text-muted-foreground">
              © 2025 StartupVerse. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
