import { useState } from "react";
import {
  ArrowRight,
  Check,
  Star,
  Users,
  Briefcase,
  Sparkles,
  Zap,
  TrendingUp,
  Target,
  CheckCircle2,
  Gift,
  Rocket,
  Award,
  DollarSign,
  Shield,
  MessageSquare,
  Clock,
  Calendar,
  Video,
  Map,
  Globe2,
} from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { toast } from "sonner";
import { fetchEnvelope } from "../utils/backendClient.js";

export default function TalentWaitlistPage({ onBack }) {
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await fetchEnvelope("/public/talent-waitlist", {
        method: "POST",
        body: JSON.stringify({ email, payload: { source: "talent-waitlist-page" } }),
      });
      setIsSubmitted(true);
      setTimeout(() => {
        setIsSubmitted(false);
        setEmail("");
      }, 5000);
    } catch (err) {
      toast.error(err?.message || "Could not join waitlist. Try again.");
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <div className="min-h-screen bg-background">
      <section className="relative overflow-hidden bg-gradient-to-br from-[#3A5AFE]/5 via-background to-[#2ECC71]/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
          <div className="text-center mb-12">
            <div className="flex justify-center mb-8">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#3A5AFE] to-[#2ECC71] flex items-center justify-center shadow-lg">
                <Star className="w-10 h-10 text-white" />
              </div>
            </div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#3A5AFE]/10 text-[#3A5AFE] border border-[#3A5AFE]/20 mb-6">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#3A5AFE] opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#3A5AFE]" />
              </span>
              <span>Join Top Talent - Launching Soon</span>
            </div>
            <div className="space-y-6 mb-12">
              <h1 className="text-5xl md:text-7xl max-w-5xl mx-auto">
                Get matched with{" "}
                <span className="bg-gradient-to-r from-[#3A5AFE] to-[#2ECC71] bg-clip-text text-transparent">
                  high-potential startups
                </span>{" "}
                seeking talent like you.
              </h1>
              <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto">
                Find startups offering competitive pay, equity, and remote work.
                Collaborate in our Virtual Office and own what you build.
              </p>
            </div>
            {isSubmitted ? (
              <div className="bg-[#2ECC71]/10 border border-[#2ECC71]/20 rounded-2xl p-8 space-y-3 animate-in fade-in slide-in-from-bottom-4 max-w-md mx-auto">
                <div className="w-16 h-16 rounded-full bg-[#2ECC71] flex items-center justify-center mx-auto">
                  <Check className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl">You're on the waitlist!</h2>
                <p className="text-muted-foreground">
                  Check your email for confirmation. We'll notify you when
                  exciting startup opportunities match your profile.
                </p>
              </div>
            ) : (
              <div className="space-y-6 max-w-2xl mx-auto">
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
                <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground flex-wrap">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#2ECC71]" />
                    <span>Early access to opportunities</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#2ECC71]" />
                    <span>AI-powered matching</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#2ECC71]" />
                    <span>Free forever</span>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="relative max-w-5xl mx-auto">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl">
              <ImageWithFallback
                src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0ZWFtJTIwd29ya2luZyUyMHRvZ2V0aGVyfGVufDF8fHx8MTc2NDkyODAwMHww&ixlib=rb-4.1.0&q=80&w=1080"
                alt="Team working together"
                className="w-full h-[500px] object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/50 to-transparent" />
            </div>
          </div>
          <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto">
            <div className="space-y-2 text-center">
              <div className="flex items-center justify-center gap-2">
                <Users className="w-5 h-5 text-[#3A5AFE]" />
                <span className="text-3xl">200+</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Talent on waitlist
              </p>
            </div>
            <div className="space-y-2 text-center">
              <div className="flex items-center justify-center gap-2">
                <Rocket className="w-5 h-5 text-[#2ECC71]" />
                <span className="text-3xl">50+</span>
              </div>
              <p className="text-sm text-muted-foreground">Active startups</p>
            </div>
            <div className="space-y-2 text-center">
              <div className="flex items-center justify-center gap-2">
                <Clock className="w-5 h-5 text-[#3A5AFE]" />
                <span className="text-3xl">48h</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Average match time
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
                  <span>For Talent - Always Free</span>
                </div>
                <div className="space-y-4">
                  <div className="text-8xl md:text-9xl">$0</div>
                  <h2 className="text-3xl md:text-5xl">
                    100% Free for Talent. Forever.
                  </h2>
                  <p className="text-xl md:text-2xl text-white/90 max-w-2xl mx-auto">
                    No hidden fees, no subscription charges. Join startups, get
                    equity opportunities, and build your career—completely free.
                  </p>
                </div>
                <div className="grid md:grid-cols-3 gap-6 pt-6">
                  <div className="p-6 rounded-xl bg-white/10 backdrop-blur-sm space-y-2">
                    <div className="text-4xl">$0</div>
                    <div className="text-lg">Platform Access</div>
                    <div className="text-sm text-white/80">
                      Unlimited forever
                    </div>
                  </div>
                  <div className="p-6 rounded-xl bg-white/10 backdrop-blur-sm space-y-2">
                    <div className="text-4xl">∞</div>
                    <div className="text-lg">Startup Matches</div>
                    <div className="text-sm text-white/80">
                      No limits on opportunities
                    </div>
                  </div>
                  <div className="p-6 rounded-xl bg-white/10 backdrop-blur-sm space-y-2">
                    <div className="text-4xl">💰</div>
                    <div className="text-lg">Equity Potential</div>
                    <div className="text-sm text-white/80">
                      Get ownership in startups
                    </div>
                  </div>
                </div>
                <div className="pt-6">
                  <div className="inline-flex items-center gap-2 text-lg">
                    <CheckCircle2 className="w-6 h-6" />
                    <span>
                      No credit card required. Just your email and skills.
                    </span>
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
            <h2 className="text-4xl md:text-5xl">The Job Search Struggle</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Finding the right startup shouldn't mean endless applications and
              ghosting.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <div className="p-8 rounded-2xl bg-red-500/5 border border-red-500/20">
              <h3 className="text-2xl mb-4 text-red-500">
                ❌ Traditional Job Hunting
              </h3>
              <ul className="space-y-3 text-muted-foreground">
                <li className="flex items-start gap-3">
                  <span className="text-red-500 mt-1">•</span>
                  <span>Applying to hundreds of generic job postings</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-red-500 mt-1">•</span>
                  <span>Getting ghosted after multiple interview rounds</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-red-500 mt-1">•</span>
                  <span>No transparency on compensation or equity</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-red-500 mt-1">•</span>
                  <span>Limited growth potential in established companies</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-red-500 mt-1">•</span>
                  <span>Can't find startups that match your values</span>
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
                    AI matches you with startups seeking your exact skills
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-[#2ECC71] mt-1 flex-shrink-0" />
                  <span>
                    Direct access to founders, no recruitment middlemen
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-[#2ECC71] mt-1 flex-shrink-0" />
                  <span>
                    Full transparency on salary ranges and equity packages
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-[#2ECC71] mt-1 flex-shrink-0" />
                  <span>
                    Join early-stage startups with explosive growth potential
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-[#2ECC71] mt-1 flex-shrink-0" />
                  <span>
                    Find startups that align with your passion and values
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
            <h2 className="text-4xl md:text-5xl">Not Just a Job Board</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              StartupVerse is where you find your team AND work with them—all in
              one platform.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="p-8 rounded-2xl bg-gradient-to-br from-[#3A5AFE]/5 to-[#3A5AFE]/10 border border-[#3A5AFE]/20 space-y-4">
              <div className="w-14 h-14 rounded-xl bg-[#3A5AFE] flex items-center justify-center">
                <Sparkles className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-2xl">AI-Powered Matching</h3>
              <p className="text-muted-foreground">
                Our intelligent algorithm matches you with startups based on
                your skills, experience, career goals, and cultural fit. No more
                spray-and-pray applications.
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#3A5AFE]" />
                  <span>Skills and tech stack matching</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#3A5AFE]" />
                  <span>Culture and values alignment</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#3A5AFE]" />
                  <span>Career growth potential scoring</span>
                </li>
              </ul>
            </div>
            <div className="p-8 rounded-2xl bg-gradient-to-br from-[#2ECC71]/5 to-[#2ECC71]/10 border border-[#2ECC71]/20 space-y-4">
              <div className="w-14 h-14 rounded-xl bg-[#2ECC71] flex items-center justify-center">
                <DollarSign className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-2xl">Transparent Compensation</h3>
              <p className="text-muted-foreground">
                See exactly what each startup offers upfront: equity only,
                salary only, or both. Choose what fits your situation—whether
                you want high equity stakes, competitive cash, or a balanced
                package.
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#2ECC71]" />
                  <span>Equity only (3-10% for early believers)</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#2ECC71]" />
                  <span>Salary only (competitive market rates)</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#2ECC71]" />
                  <span>Both salary + equity (best of both worlds)</span>
                </li>
              </ul>
            </div>
            <div className="p-8 rounded-2xl bg-gradient-to-br from-[#3A5AFE]/5 to-[#2ECC71]/10 border border-[#3A5AFE]/20 space-y-4">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#3A5AFE] to-[#2ECC71] flex items-center justify-center">
                <Users className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-2xl">Direct Founder Access</h3>
              <p className="text-muted-foreground">
                Talk directly to founders. No recruitment agencies, no
                gatekeepers. Have real conversations about the role, vision, and
                your potential impact.
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#3A5AFE]" />
                  <span>Meet founders directly</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#3A5AFE]" />
                  <span>Understand the vision firsthand</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#3A5AFE]" />
                  <span>Fast-track interview process</span>
                </li>
              </ul>
            </div>
            <div className="p-8 rounded-2xl bg-gradient-to-br from-[#2ECC71]/5 to-[#3A5AFE]/10 border border-[#2ECC71]/20 space-y-4">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#2ECC71] to-[#3A5AFE] flex items-center justify-center">
                <TrendingUp className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-2xl">Accelerated Growth</h3>
              <p className="text-muted-foreground">
                Early-stage startups mean you wear multiple hats and learn
                rapidly. Gain experience that would take years at a large
                company.
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#2ECC71]" />
                  <span>Diverse skill development</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#2ECC71]" />
                  <span>Leadership opportunities</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#2ECC71]" />
                  <span>Shape product and culture</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>
      <section className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-4xl md:text-5xl">More Than Just Matching</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              You're not just finding a job—you're joining a complete startup
              building platform with everything your team needs.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="p-8 rounded-2xl bg-gradient-to-br from-[#2ECC71]/5 to-[#2ECC71]/10 border border-[#2ECC71]/20 space-y-4">
              <div className="w-14 h-14 rounded-xl bg-[#2ECC71] flex items-center justify-center">
                <Video className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-2xl">Work in the Virtual Office</h3>
              <p className="text-muted-foreground">
                Once matched, work alongside your startup team in an immersive
                Virtual Office. Built-in video calls, messaging, task
                management—everything in one workspace. No Slack, Zoom, or
                Notion needed.
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#2ECC71]" />
                  <span>Real-time video collaboration</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#2ECC71]" />
                  <span>Instant messaging and presence</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#2ECC71]" />
                  <span>All tools in one interface</span>
                </li>
              </ul>
            </div>
            <div className="p-8 rounded-2xl bg-gradient-to-br from-[#3A5AFE]/5 to-[#3A5AFE]/10 border border-[#3A5AFE]/20 space-y-4">
              <div className="w-14 h-14 rounded-xl bg-[#3A5AFE] flex items-center justify-center">
                <Globe2 className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-2xl">Work From Anywhere</h3>
              <p className="text-muted-foreground">
                No office required. No location barriers. Work from anywhere in
                the world with your startup team. The Virtual Office brings
                everyone together regardless of timezone or geography.
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#3A5AFE]" />
                  <span>100% remote-first platform</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#3A5AFE]" />
                  <span>Timezone-aware matching</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#3A5AFE]" />
                  <span>Async collaboration built-in</span>
                </li>
              </ul>
            </div>
            <div className="p-8 rounded-2xl bg-gradient-to-br from-[#3A5AFE]/5 to-[#2ECC71]/10 border border-[#3A5AFE]/20 space-y-4">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#3A5AFE] to-[#2ECC71] flex items-center justify-center">
                <Map className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-2xl">Access to 35+ Startup Tools</h3>
              <p className="text-muted-foreground">
                As a team member, get full access to our 6-stage Startup Journey
                Roadmap with 35+ purpose-built tools. From ideation to growth,
                everything you need is built right into the platform.
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#3A5AFE]" />
                  <span>Idea validation frameworks</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#3A5AFE]" />
                  <span>Product development tools</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#3A5AFE]" />
                  <span>Growth and scaling resources</span>
                </li>
              </ul>
            </div>
            <div className="p-8 rounded-2xl bg-gradient-to-br from-[#2ECC71]/5 to-[#3A5AFE]/10 border border-[#2ECC71]/20 space-y-4">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#2ECC71] to-[#3A5AFE] flex items-center justify-center">
                <Zap className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-2xl">Build Without Limits</h3>
              <p className="text-muted-foreground">
                Stop juggling multiple subscriptions. Everything your startup
                needs lives in one platform—communication, collaboration,
                roadmap, tools, team matching. One login, unlimited potential.
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#2ECC71]" />
                  <span>All-in-one workspace</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#2ECC71]" />
                  <span>No tool switching required</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#2ECC71]" />
                  <span>Free access to everything</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>
      <section className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-4xl md:text-5xl">Waitlist Member Perks</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Be among the first to access exciting startup opportunities.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="p-6 rounded-xl bg-background border border-border space-y-3">
              <div className="w-12 h-12 rounded-lg bg-[#3A5AFE]/10 flex items-center justify-center">
                <Star className="w-6 h-6 text-[#3A5AFE]" />
              </div>
              <h3 className="text-xl">First Access</h3>
              <p className="text-sm text-muted-foreground">
                Get matched with the best startups before anyone else. Early
                members get first dibs on opportunities.
              </p>
            </div>
            <div className="p-6 rounded-xl bg-background border border-border space-y-3">
              <div className="w-12 h-12 rounded-lg bg-[#2ECC71]/10 flex items-center justify-center">
                <Award className="w-6 h-6 text-[#2ECC71]" />
              </div>
              <h3 className="text-xl">Premium Profile Badge</h3>
              <p className="text-sm text-muted-foreground">
                Stand out with a special early member badge on your profile that
                shows startups you're serious.
              </p>
            </div>
            <div className="p-6 rounded-xl bg-background border border-border space-y-3">
              <div className="w-12 h-12 rounded-lg bg-[#3A5AFE]/10 flex items-center justify-center">
                <Target className="w-6 h-6 text-[#3A5AFE]" />
              </div>
              <h3 className="text-xl">Better Matches</h3>
              <p className="text-sm text-muted-foreground">
                Early members get matched with other early adopters—the most
                motivated and ambitious startups.
              </p>
            </div>
            <div className="p-6 rounded-xl bg-background border border-border space-y-3">
              <div className="w-12 h-12 rounded-lg bg-[#2ECC71]/10 flex items-center justify-center">
                <Shield className="w-6 h-6 text-[#2ECC71]" />
              </div>
              <h3 className="text-xl">Priority Support</h3>
              <p className="text-sm text-muted-foreground">
                Dedicated support to help you create the perfect profile and
                land your ideal startup role.
              </p>
            </div>
            <div className="p-6 rounded-xl bg-background border border-border space-y-3">
              <div className="w-12 h-12 rounded-lg bg-[#3A5AFE]/10 flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-[#3A5AFE]" />
              </div>
              <h3 className="text-xl">Exclusive Community</h3>
              <p className="text-sm text-muted-foreground">
                Join a private community of talented professionals and ambitious
                founders building the future.
              </p>
            </div>
            <div className="p-6 rounded-xl bg-background border border-border space-y-3">
              <div className="w-12 h-12 rounded-lg bg-[#2ECC71]/10 flex items-center justify-center">
                <Briefcase className="w-6 h-6 text-[#2ECC71]" />
              </div>
              <h3 className="text-xl">Career Guidance</h3>
              <p className="text-sm text-muted-foreground">
                Get personalized advice on positioning yourself for startup
                roles and negotiating equity packages.
              </p>
            </div>
          </div>
        </div>
      </section>
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-4xl md:text-5xl">What Happens Next</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Here's your journey after joining the waitlist.
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
                  Sign up and receive confirmation email with tips on optimizing
                  your startup profile.
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
                <h3 className="text-xl mb-2">Week 1-2 - Profile Setup</h3>
                <p className="text-muted-foreground">
                  Get early access to create your profile, showcase your skills,
                  and set your preferences.
                </p>
              </div>
            </div>
            <div className="flex gap-6">
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-[#2ECC71] flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div className="w-0.5 h-full bg-[#3A5AFE]/20 mt-2" />
              </div>
              <div className="pb-8">
                <h3 className="text-xl mb-2">Week 3 - First Matches</h3>
                <p className="text-muted-foreground">
                  Start receiving matched startup opportunities and connect
                  directly with founders.
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
                <h3 className="text-xl mb-2">Week 4+ - Launch Your Career</h3>
                <p className="text-muted-foreground">
                  Full platform access. Start interviewing, join your ideal
                  startup, and build something great.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="py-20 bg-muted/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-4xl md:text-5xl">Frequently Asked Questions</h2>
          </div>
          <div className="space-y-6">
            <div className="p-6 rounded-xl bg-background border border-border">
              <h3 className="text-lg mb-2">
                Is StartupVerse really free for talent?
              </h3>
              <p className="text-sm text-muted-foreground">
                Yes, 100% free forever. We make money by charging startups a
                small fee, not talent. Your access, matches, and opportunities
                are completely free.
              </p>
            </div>
            <div className="p-6 rounded-xl bg-background border border-border">
              <h3 className="text-lg mb-2">What compensation can I expect?</h3>
              <p className="text-sm text-muted-foreground">
                {"Startups offer three models: "}
                <strong>equity only</strong>
                {
                  " (3-10% ownership for early believers who want maximum upside), "
                }
                <strong>salary only</strong>
                {" (competitive market rates with no equity), or "}
                <strong>both salary + equity</strong>
                {
                  " ($40-140k salary + 0.5-10% equity depending on stage). All compensation details are transparent before you match, so you can filter by what works for you."
                }
              </p>
            </div>
            <div className="p-6 rounded-xl bg-background border border-border">
              <h3 className="text-lg mb-2">
                What types of roles are available?
              </h3>
              <p className="text-sm text-muted-foreground">
                Everything from engineering and design to marketing, sales, and
                operations. Both full-time and part-time roles, with co-founder
                opportunities too.
              </p>
            </div>
            <div className="p-6 rounded-xl bg-background border border-border">
              <h3 className="text-lg mb-2">
                How does the matching algorithm work?
              </h3>
              <p className="text-sm text-muted-foreground">
                We analyze your skills, experience, preferences, and career
                goals, then match you with startups seeking exactly that
                profile. Both sides must express interest before connecting.
              </p>
            </div>
            <div className="p-6 rounded-xl bg-background border border-border">
              <h3 className="text-lg mb-2">What if I'm currently employed?</h3>
              <p className="text-sm text-muted-foreground">
                That's fine! Many members are exploring opportunities while
                employed. You control your profile visibility and can browse
                anonymously.
              </p>
            </div>
            <div className="p-6 rounded-xl bg-background border border-border">
              <h3 className="text-lg mb-2">When will I get my first match?</h3>
              <p className="text-sm text-muted-foreground">
                Typically within 48 hours of completing your profile. The better
                your profile, the faster and more relevant your matches will be.
              </p>
            </div>
          </div>
        </div>
      </section>
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="space-y-8">
            <div className="space-y-4">
              <h2 className="text-4xl md:text-5xl">
                Ready to Join Something Great?
              </h2>
              <p className="text-xl text-muted-foreground">
                Join 200+ talented professionals on the waitlist. Your next
                career move starts here.
              </p>
            </div>
            {!isSubmitted && (
              <form onSubmit={handleSubmit} className="max-w-md mx-auto">
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
            )}
            <p className="text-sm text-muted-foreground">
              No spam. Unsubscribe anytime. We respect your inbox.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
