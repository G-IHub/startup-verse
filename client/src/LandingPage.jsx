import React, { useState } from "react";
import {
  Check,
  ArrowRight,
  Zap,
  Users,
  Target,
  MessageSquare,
  Video,
  Sparkles,
  X,
  Menu,
  Map,
  Wrench,
  Lightbulb,
  FileText,
  Rocket,
  TrendingUp,
  Clock,
  DollarSign,
} from "lucide-react";
import { ImageWithFallback } from "./components/figma/ImageWithFallback";
export default function LandingPage() {
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const handleWaitlistSubmit = (e) => {
    e.preventDefault();
    // TODO: Connect to backend/email service
    console.log("Waitlist signup:", email);
    setIsSubmitted(true);
    setTimeout(() => {
      setIsSubmitted(false);
      setEmail("");
    }, 3000);
  };
  return (
    <div className="min-h-screen bg-white">
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-lg border-b border-gray-200 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#3A5AFE] to-[#2ECC71] flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-gray-900">
                StartupVerse
              </span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <a
                href="#features"
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                Features
              </a>
              <a
                href="#pricing"
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                Pricing
              </a>
              <a
                href="#how-it-works"
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                How It Works
              </a>
              <button className="px-4 py-2 rounded-lg bg-[#3A5AFE] text-white hover:bg-[#2948CC] transition-colors">
                Start Free Trial
              </button>
            </div>
            <button
              className="md:hidden p-2 text-gray-600"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
          {mobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-gray-200">
              <div className="flex flex-col gap-4">
                <a
                  href="#features"
                  className="text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Features
                </a>
                <a
                  href="#pricing"
                  className="text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Pricing
                </a>
                <a
                  href="#how-it-works"
                  className="text-gray-600 hover:text-gray-900 transition-colors"
                >
                  How It Works
                </a>
                <button className="px-4 py-2 rounded-lg bg-[#3A5AFE] text-white hover:bg-[#2948CC] transition-colors">
                  Start Free Trial
                </button>
              </div>
            </div>
          )}
        </div>
      </nav>
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#3A5AFE]/10 text-[#3A5AFE] mb-6">
              <Sparkles className="w-4 h-4" />
              <span className="text-sm">
                Launching Q1 2026 • Join 500+ Founders
              </span>
            </div>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl text-gray-900 mb-6 max-w-5xl mx-auto">
              Everything You Need to Build Your{" "}
              <span className="bg-gradient-to-r from-[#3A5AFE] to-[#2ECC71] bg-clip-text text-transparent">
                Startup
              </span>
            </h1>
            <p className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto">
              From idea to launch: Get a proven roadmap, find your perfect team,
              and build together in one immersive Virtual Office—with built-in
              compensation tracking and real-time analytics.
            </p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-6xl mx-auto mb-12">
              <div className="bg-white p-6 rounded-xl border-2 border-gray-200 transition-all hover:shadow-lg">
                <div className="w-12 h-12 rounded-lg bg-[#3A5AFE]/10 flex items-center justify-center mb-3 mx-auto">
                  <Map className="w-6 h-6 text-[#3A5AFE]" />
                </div>
                <h3 className="text-gray-900 mb-2">
                  Startup Roadmap
                </h3>
                <p className="text-sm text-gray-600">
                  6-stage framework from idea to scale
                </p>
              </div>
              <div className="bg-white p-6 rounded-xl border-2 border-gray-200 transition-all hover:shadow-lg">
                <div className="w-12 h-12 rounded-lg bg-[#2ECC71]/10 flex items-center justify-center mb-3 mx-auto">
                  <Users className="w-6 h-6 text-[#2ECC71]" />
                </div>
                <h3 className="text-gray-900 mb-2">
                  Smart Matching
                </h3>
                <p className="text-sm text-gray-600">
                  Algorithm-based team finding
                </p>
              </div>
              <div className="bg-white p-6 rounded-xl border-2 border-gray-200 transition-all hover:shadow-lg">
                <div className="w-12 h-12 rounded-lg bg-[#3A5AFE]/10 flex items-center justify-center mb-3 mx-auto">
                  <Sparkles className="w-6 h-6 text-[#3A5AFE]" />
                </div>
                <h3 className="text-gray-900 mb-2">
                  Virtual Office
                </h3>
                <p className="text-sm text-gray-600">
                  Immersive workspace with analytics
                </p>
              </div>
              <div className="bg-white p-6 rounded-xl border-2 border-gray-200 transition-all hover:shadow-lg">
                <div className="w-12 h-12 rounded-lg bg-[#2ECC71]/10 flex items-center justify-center mb-3 mx-auto">
                  <Wrench className="w-6 h-6 text-[#2ECC71]" />
                </div>
                <h3 className="text-gray-900 mb-2">
                  All-in-One
                </h3>
                <p className="text-sm text-gray-600">
                  Replace 5 tools, save $500/month
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              {isSubmitted ? (
                <div className="flex items-center gap-2 px-6 py-3 rounded-lg bg-[#2ECC71] text-white">
                  <Check className="w-5 h-5" />
                  <span>You're on the list! Check your email.</span>
                </div>
              ) : (
                <form
                  onSubmit={handleWaitlistSubmit}
                  className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto"
                >
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    required={true}
                    className="px-4 py-3 rounded-lg border border-gray-300 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#3A5AFE] flex-1"
                  />
                  <button
                    type="submit"
                    className="px-6 py-3 rounded-lg bg-[#3A5AFE] text-white hover:bg-[#2948CC] transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
                  >
                    Join Waitlist
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </form>
              )}
            </div>
            <div className="flex items-center justify-center gap-6 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-[#2ECC71]" />
                <span>Free for teams up to 5</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-[#2ECC71]" />
                <span>No credit card required</span>
              </div>
            </div>
          </div>
          <div className="relative max-w-5xl mx-auto">
            <div className="absolute inset-0 bg-gradient-to-br from-[#3A5AFE]/20 to-[#2ECC71]/20 rounded-2xl blur-3xl" />
            <div className="relative bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
              <div className="bg-gray-100 px-4 py-3 border-b border-gray-200 flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="ml-4 text-sm text-gray-600">
                  Virtual Office
                </span>
              </div>
              <ImageWithFallback
                src="https://images.unsplash.com/photo-1557804506-669a67965ba0?w=1200&h=700&fit=crop"
                alt="StartupVerse Virtual Office"
                className="w-full h-auto"
              />
            </div>
          </div>
        </div>
      </section>
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl text-gray-900 mb-4">
              Why Most Startups Fail
            </h2>
            <p className="text-xl text-gray-600">
              StartupVerse solves all four critical problems
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-xl border border-gray-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
                  <X className="w-5 h-5 text-red-600" />
                </div>
                <h3 className="text-gray-900">No Clear Plan</h3>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                "What should I build first? Am I ready to fundraise?"
              </p>
              <div className="flex items-center gap-2 text-sm">
                <Check className="w-4 h-4 text-[#2ECC71] flex-shrink-0" />
                <span className="text-[#2ECC71]">
                  6-Stage Roadmap guides you
                </span>
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
                  <X className="w-5 h-5 text-red-600" />
                </div>
                <h3 className="text-gray-900">
                  Can't Find Team
                </h3>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                "Need a technical co-founder but LinkedIn isn't working"
              </p>
              <div className="flex items-center gap-2 text-sm">
                <Check className="w-4 h-4 text-[#2ECC71] flex-shrink-0" />
                <span className="text-[#2ECC71]">
                  Smart Matching finds them
                </span>
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
                  <X className="w-5 h-5 text-red-600" />
                </div>
                <h3 className="text-gray-900">
                  Scattered Tools
                </h3>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                "Team is spread across Slack, Notion, Linear, Zoom..."
              </p>
              <div className="flex items-center gap-2 text-sm">
                <Check className="w-4 h-4 text-[#2ECC71] flex-shrink-0" />
                <span className="text-[#2ECC71]">
                  Virtual Office unifies all
                </span>
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
                  <X className="w-5 h-5 text-red-600" />
                </div>
                <h3 className="text-gray-900">Burning Cash</h3>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                "SaaS subscriptions eating into our runway"
              </p>
              <div className="flex items-center gap-2 text-sm">
                <Check className="w-4 h-4 text-[#2ECC71] flex-shrink-0" />
                <span className="text-[#2ECC71]">Save $500/month</span>
              </div>
            </div>
          </div>
          <div className="mt-12 max-w-4xl mx-auto">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-xl border border-gray-200">
                <h3 className="text-gray-900 mb-4 flex items-center gap-2">
                  <X className="w-5 h-5 text-red-600" />
                  The Old Way
                </h3>
                <ul className="space-y-2 text-sm text-gray-600 mb-4">
                  <li className="flex items-center justify-between">
                    <span>Slack messaging</span>
                    <span>$40/mo</span>
                  </li>
                  <li className="flex items-center justify-between">
                    <span>Notion docs</span>
                    <span>$50/mo</span>
                  </li>
                  <li className="flex items-center justify-between">
                    <span>Linear tasks</span>
                    <span>$40/mo</span>
                  </li>
                  <li className="flex items-center justify-between">
                    <span>Zoom video</span>
                    <span>$15/mo</span>
                  </li>
                  <li className="flex items-center justify-between">
                    <span>LinkedIn recruiting</span>
                    <span>$99/mo</span>
                  </li>
                </ul>
                <div className="pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-900">
                      Total per month:
                    </span>
                    <span className="text-xl text-red-600">$244</span>
                  </div>
                </div>
              </div>
              <div className="bg-gradient-to-br from-[#3A5AFE] to-[#2ECC71] p-6 rounded-xl text-white">
                <h3 className="mb-4 flex items-center gap-2">
                  <Check className="w-5 h-5" />
                  The StartupVerse Way
                </h3>
                <ul className="space-y-2 text-sm mb-4">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4" />
                    Task management built-in
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4" />
                    Real-time team messaging
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4" />
                    Video calls integrated
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4" />
                    Smart team matching
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4" />
                    Startup journey roadmap
                  </li>
                </ul>
                <div className="pt-4 border-t border-white/20">
                  <div className="flex items-center justify-between mb-2">
                    <span>Total per month (team of 5):</span>
                    <span className="text-2xl">$0</span>
                  </div>
                  <p className="text-sm text-white/80">💰 Save $2,928/year</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#3A5AFE]/10 text-[#3A5AFE] mb-4">
                <Map className="w-4 h-4" />
                <span className="text-sm">Pillar 1: Strategic Guidance</span>
              </div>
              <h2 className="text-4xl sm:text-5xl text-gray-900 mb-6">
                Your Startup Journey Roadmap
              </h2>
              <p className="text-xl text-gray-600 mb-8">
                Never wonder what to do next. Follow a proven 6-stage framework
                from idea validation to product-market fit.
              </p>
              <div className="space-y-4 mb-8">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#3A5AFE]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Lightbulb className="w-4 h-4 text-[#3A5AFE]" />
                  </div>
                  <div>
                    <h4 className="text-gray-900 mb-1">
                      Stage 1: Ideation & Validation (1-4 weeks)
                    </h4>
                    <p className="text-sm text-gray-600">
                      Idea Canvas, Market Research, Competitor Analysis,
                      Customer Interviews
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#3A5AFE]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <FileText className="w-4 h-4 text-[#3A5AFE]" />
                  </div>
                  <div>
                    <h4 className="text-gray-900 mb-1">
                      Stage 2: Company Formation (1-2 weeks)
                    </h4>
                    <p className="text-sm text-gray-600">
                      Entity Setup, Founder Agreements, Cap Table, Document
                      Vault
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#2ECC71]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Users className="w-4 h-4 text-[#2ECC71]" />
                  </div>
                  <div>
                    <h4 className="text-gray-900 mb-1">
                      Stage 3: Team Building (4-8 weeks)
                    </h4>
                    <p className="text-sm text-gray-600">
                      Smart Matching, Equity Offers, Team Charter, Role
                      Definitions
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#3A5AFE]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Rocket className="w-4 h-4 text-[#3A5AFE]" />
                  </div>
                  <div>
                    <h4 className="text-gray-900 mb-1">
                      Stage 4: Product Development (8-16 weeks)
                    </h4>
                    <p className="text-sm text-gray-600">
                      Product Roadmap, Sprint Planning, Task Management, Launch
                      Checklist
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#2ECC71]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <TrendingUp className="w-4 h-4 text-[#2ECC71]" />
                  </div>
                  <div>
                    <h4 className="text-gray-900 mb-1">
                      Stage 5: Go-to-Market (8-12 weeks)
                    </h4>
                    <p className="text-sm text-gray-600">
                      CRM, Sales Pipeline, Marketing Hub, Email Campaigns,
                      Analytics
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#3A5AFE]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Target className="w-4 h-4 text-[#3A5AFE]" />
                  </div>
                  <div>
                    <h4 className="text-gray-900 mb-1">
                      Stage 6: Operations & Growth (12-24 weeks)
                    </h4>
                    <p className="text-sm text-gray-600">
                      Financial Dashboard, Budget Planning, OKR Tracking,
                      Knowledge Base
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock className="w-4 h-4 text-[#2ECC71]" />
                  <span>
                    35-62 weeks total journey • 35+ purpose-built tools • Clear
                    completion criteria
                  </span>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6">
                <ImageWithFallback
                  src="https://images.unsplash.com/photo-1553028826-f4804a6dba3b?w=800&h=600&fit=crop"
                  alt="Startup Journey Roadmap"
                  className="w-full h-auto rounded-lg"
                />
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">
                      Overall Progress
                    </span>
                    <span className="text-gray-900">
                      3/6 Stages Complete
                    </span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full w-1/2 bg-gray-400" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1">
              <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6">
                <ImageWithFallback
                  src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&h=600&fit=crop"
                  alt="Smart Team Matching"
                  className="w-full h-auto rounded-lg"
                />
                <div className="mt-4 grid grid-cols-3 gap-3">
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-2xl text-gray-900 mb-1">
                      95%
                    </div>
                    <div className="text-xs text-gray-600">
                      Match Score
                    </div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-2xl text-gray-900 mb-1">
                      12
                    </div>
                    <div className="text-xs text-gray-600">
                      Skills Match
                    </div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-2xl text-gray-900 mb-1">
                      AI
                    </div>
                    <div className="text-xs text-gray-600">
                      Powered
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#2ECC71]/10 text-[#2ECC71] mb-4">
                <Users className="w-4 h-4" />
                <span className="text-sm">Pillar 2: Team Assembly</span>
              </div>
              <h2 className="text-4xl sm:text-5xl text-gray-900 mb-6">
                Smart Team Matching
              </h2>
              <p className="text-xl text-gray-600 mb-8">
                Find your perfect co-founder and teammates with AI-powered
                matching. No more endless LinkedIn searching.
              </p>
              <div className="space-y-6 mb-8">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-[#2ECC71]/10 flex items-center justify-center flex-shrink-0">
                    <Check className="w-5 h-5 text-[#2ECC71]" />
                  </div>
                  <div>
                    <h4 className="text-gray-900 mb-1">
                      AI-Powered Matching Algorithm
                    </h4>
                    <p className="text-sm text-gray-600">
                      Match based on skills, experience, values, and startup
                      stage
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-[#2ECC71]/10 flex items-center justify-center flex-shrink-0">
                    <Check className="w-5 h-5 text-[#2ECC71]" />
                  </div>
                  <div>
                    <h4 className="text-gray-900 mb-1">
                      3 Role Types
                    </h4>
                    <p className="text-sm text-gray-600">
                      Founders, Team Members (full-time), and Talent
                      (contractors)
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-[#2ECC71]/10 flex items-center justify-center flex-shrink-0">
                    <Check className="w-5 h-5 text-[#2ECC71]" />
                  </div>
                  <div>
                    <h4 className="text-gray-900 mb-1">
                      Equity Offer Builder
                    </h4>
                    <p className="text-sm text-gray-600">
                      Send fair compensation offers with equity calculator
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-[#2ECC71]/10 flex items-center justify-center flex-shrink-0">
                    <Check className="w-5 h-5 text-[#2ECC71]" />
                  </div>
                  <div>
                    <h4 className="text-gray-900 mb-1">
                      Direct Connections
                    </h4>
                    <p className="text-sm text-gray-600">
                      Message and video call potential co-founders instantly
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-gradient-to-br from-[#2ECC71]/10 to-[#3A5AFE]/10 p-4 rounded-lg border border-[#2ECC71]/20">
                <p className="text-sm text-gray-700">
                  <span className="text-[#2ECC71]">💡 Pro tip:</span>
                  {
                    " The roadmap guides you on when to hire each role (designer in Stage 4, marketer in Stage 5, etc.)"
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#3A5AFE]/10 text-[#3A5AFE] mb-4">
                <Sparkles className="w-4 h-4" />
                <span className="text-sm">Pillar 3: Immersive Workspace</span>
              </div>
              <h2 className="text-4xl sm:text-5xl text-gray-900 mb-6">
                Your Virtual Office
              </h2>
              <p className="text-xl text-gray-600 mb-8">
                Work like you're in the same room. An immersive digital
                headquarters where everything happens.
              </p>
              <div className="space-y-6 mb-8">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-[#3A5AFE]/10 flex items-center justify-center flex-shrink-0">
                    <Check className="w-5 h-5 text-[#3A5AFE]" />
                  </div>
                  <div>
                    <h4 className="text-gray-900 mb-1">
                      Spatial Workspace Design
                    </h4>
                    <p className="text-sm text-gray-600">
                      Not just another dashboard—a real office metaphor with
                      rooms and panels
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-[#3A5AFE]/10 flex items-center justify-center flex-shrink-0">
                    <Check className="w-5 h-5 text-[#3A5AFE]" />
                  </div>
                  <div>
                    <h4 className="text-gray-900 mb-1">
                      Slide-Out Panels
                    </h4>
                    <p className="text-sm text-gray-600">
                      Tasks (⌘T), Messages (⌘M), Team (⌘U)—instant access
                      without switching apps
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-[#3A5AFE]/10 flex items-center justify-center flex-shrink-0">
                    <Check className="w-5 h-5 text-[#3A5AFE]" />
                  </div>
                  <div>
                    <h4 className="text-gray-900 mb-1">
                      Floating Video Calls
                    </h4>
                    <p className="text-sm text-gray-600">
                      Video overlays stay on top while you work—like being in
                      the same room
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-[#3A5AFE]/10 flex items-center justify-center flex-shrink-0">
                    <Check className="w-5 h-5 text-[#3A5AFE]" />
                  </div>
                  <div>
                    <h4 className="text-gray-900 mb-1">
                      Keyboard-First Navigation
                    </h4>
                    <p className="text-sm text-gray-600">
                      Power users love shortcuts—designed for speed and
                      efficiency
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-[#3A5AFE]/10 flex items-center justify-center flex-shrink-0">
                    <Check className="w-5 h-5 text-[#3A5AFE]" />
                  </div>
                  <div>
                    <h4 className="text-gray-900 mb-1">
                      Beautiful Dark Mode
                    </h4>
                    <p className="text-sm text-gray-600">
                      Gorgeous design that works 24/7—easy on the eyes during
                      late-night builds
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">
                  "It's not just a tool—it's where your startup lives. Every
                  conversation, every task, every milestone."
                </p>
              </div>
            </div>
            <div className="relative">
              <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
                <div className="bg-gray-100 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500" />
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-600">
                    <span>⌘T Tasks</span>
                    <span>⌘M Messages</span>
                    <span>⌘U Team</span>
                  </div>
                </div>
                <ImageWithFallback
                  src="https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&h=600&fit=crop"
                  alt="Virtual Office Interface"
                  className="w-full h-auto"
                />
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#2ECC71]/10 text-[#2ECC71] mb-4">
              <Wrench className="w-4 h-4" />
              <span className="text-sm">Pillar 4: Cost Efficiency</span>
            </div>
            <h2 className="text-4xl sm:text-5xl text-gray-900 mb-6">
              Replace 5 Tools, Save $500/Month
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Stop juggling subscriptions. Everything your startup needs is
              embedded in your Virtual Office.
            </p>
          </div>
          <div className="max-w-5xl mx-auto">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-6 py-4 text-left text-sm text-gray-600">
                        Tool Category
                      </th>
                      <th className="px-6 py-4 text-left text-sm text-gray-600">
                        Traditional Stack
                      </th>
                      <th className="px-6 py-4 text-left text-sm text-gray-600">
                        Cost/Month
                      </th>
                      <th className="px-6 py-4 text-left text-sm text-gray-600">
                        StartupVerse
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    <tr>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <MessageSquare className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-900">
                            Messaging
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        Slack
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        $40
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-[#2ECC71]" />
                          <span className="text-sm text-[#2ECC71]">
                            Included
                          </span>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-900">
                            Docs & Wiki
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        Notion
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        $50
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-[#2ECC71]" />
                          <span className="text-sm text-[#2ECC71]">
                            Included
                          </span>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Target className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-900">
                            Task Management
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        Linear
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        $40
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-[#2ECC71]" />
                          <span className="text-sm text-[#2ECC71]">
                            Included
                          </span>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Video className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-900">
                            Video Calls
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        Zoom + Loom
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        $30
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-[#2ECC71]" />
                          <span className="text-sm text-[#2ECC71]">
                            Included
                          </span>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-900">
                            Recruiting
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        LinkedIn Premium
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        $99
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-[#2ECC71]" />
                          <span className="text-sm text-[#2ECC71]">
                            Included
                          </span>
                        </div>
                      </td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="px-6 py-4 text-gray-900">
                        Total
                      </td>
                      <td className="px-6 py-4" />
                      <td className="px-6 py-4 text-xl text-red-600">
                        $259/mo
                      </td>
                      <td className="px-6 py-4 text-xl text-[#2ECC71]">
                        $0/mo
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            <div className="mt-8 text-center">
              <p className="text-2xl text-gray-900 mb-2">
                {"💰 Save "}
                <span className="text-[#2ECC71]">$3,108 per year</span>
              </p>
              <p className="text-sm text-gray-600">
                Based on 5-person team. That's runway extending by months, not
                weeks.
              </p>
            </div>
            <div className="mt-12 grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 rounded-lg bg-[#3A5AFE]/10 flex items-center justify-center mx-auto mb-3">
                  <Zap className="w-6 h-6 text-[#3A5AFE]" />
                </div>
                <h4 className="text-gray-900 mb-2">
                  No Context Switching
                </h4>
                <p className="text-sm text-gray-600">
                  Stop switching between 5 browser tabs. Everything in one
                  workspace.
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 rounded-lg bg-[#2ECC71]/10 flex items-center justify-center mx-auto mb-3">
                  <DollarSign className="w-6 h-6 text-[#2ECC71]" />
                </div>
                <h4 className="text-gray-900 mb-2">
                  Extend Your Runway
                </h4>
                <p className="text-sm text-gray-600">
                  $3K/year saved = 1+ month of extra runway for bootstrapped
                  teams.
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 rounded-lg bg-[#3A5AFE]/10 flex items-center justify-center mx-auto mb-3">
                  <Clock className="w-6 h-6 text-[#3A5AFE]" />
                </div>
                <h4 className="text-gray-900 mb-2">
                  Save Time
                </h4>
                <p className="text-sm text-gray-600">
                  No onboarding 5 tools. No managing 5 subscriptions. Just
                  build.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600">
              From idea to launch in 4 simple steps
            </p>
          </div>
          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#3A5AFE] to-[#2ECC71] text-white flex items-center justify-center text-2xl mx-auto mb-4">
                1
              </div>
              <h3 className="text-xl text-gray-900 mb-2">
                Start Your Journey
              </h3>
              <p className="text-sm text-gray-600">
                Sign up free and choose your current stage (Ideation, Formation,
                etc.)
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#3A5AFE] to-[#2ECC71] text-white flex items-center justify-center text-2xl mx-auto mb-4">
                2
              </div>
              <h3 className="text-xl text-gray-900 mb-2">
                Find Your Team
              </h3>
              <p className="text-sm text-gray-600">
                Use Smart Matching to find co-founders and teammates who fit
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#3A5AFE] to-[#2ECC71] text-white flex items-center justify-center text-2xl mx-auto mb-4">
                3
              </div>
              <h3 className="text-xl text-gray-900 mb-2">
                Build Together
              </h3>
              <p className="text-sm text-gray-600">
                Work in your Virtual Office with real-time analytics tracking
                your progress
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-[#2ECC71] text-white flex items-center justify-center text-2xl mx-auto mb-4">
                ✓
              </div>
              <h3 className="text-xl text-gray-900 mb-2">
                Launch Faster
              </h3>
              <p className="text-sm text-gray-600">
                Follow the roadmap, track milestones, and ship your MVP
              </p>
            </div>
          </div>
          <div className="mt-12 text-center">
            <button className="px-8 py-4 rounded-lg bg-[#3A5AFE] text-white hover:bg-[#2948CC] transition-colors text-lg inline-flex items-center gap-2">
              Get Started Free
              <ArrowRight className="w-5 h-5" />
            </button>
            <p className="text-sm text-gray-600 mt-4">
              No credit card required • Free for teams up to 5
            </p>
          </div>
        </div>
      </section>
      <section
        id="pricing"
        className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50"
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl text-gray-900 mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-gray-600">
              Start free. Scale when you're ready.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="bg-white p-8 rounded-2xl border-2 border-gray-200">
              <h3 className="text-2xl text-gray-900 mb-2">
                Free
              </h3>
              <p className="text-gray-600 mb-6">
                Perfect for early-stage startups
              </p>
              <div className="mb-6">
                <span className="text-5xl text-gray-900">
                  $0
                </span>
                <span className="text-gray-600">/month</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-2 text-gray-600">
                  <Check className="w-5 h-5 text-[#2ECC71]" />
                  Up to 5 team members
                </li>
                <li className="flex items-center gap-2 text-gray-600">
                  <Check className="w-5 h-5 text-[#2ECC71]" />
                  All 6 roadmap stages
                </li>
                <li className="flex items-center gap-2 text-gray-600">
                  <Check className="w-5 h-5 text-[#2ECC71]" />5 team
                  matches/month
                </li>
                <li className="flex items-center gap-2 text-gray-600">
                  <Check className="w-5 h-5 text-[#2ECC71]" />
                  Virtual Office
                </li>
                <li className="flex items-center gap-2 text-gray-600">
                  <Check className="w-5 h-5 text-[#2ECC71]" />
                  Task & messaging
                </li>
              </ul>
              <button className="w-full px-6 py-3 rounded-lg border-2 border-gray-300 text-gray-900 hover:bg-gray-50 transition-colors">
                Start Free
              </button>
            </div>
            <div className="bg-gradient-to-br from-[#3A5AFE] to-[#2ECC71] p-8 rounded-2xl text-white relative">
              <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-sm">
                Most Popular
              </div>
              <h3 className="text-2xl mb-2">Pro</h3>
              <p className="text-white/80 mb-6">For growing startups</p>
              <div className="mb-6">
                <span className="text-5xl">$29</span>
                <span className="text-white/80">/month</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-2">
                  <Check className="w-5 h-5" />
                  Unlimited team members
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-5 h-5" />
                  All 6 roadmap stages
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-5 h-5" />
                  Unlimited team matching
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-5 h-5" />
                  Video call recording
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-5 h-5" />
                  Priority support
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-5 h-5" />
                  Analytics dashboard
                </li>
              </ul>
              <button className="w-full px-6 py-3 rounded-lg bg-white text-[#3A5AFE] hover:bg-gray-100 transition-colors">
                Start Free Trial
              </button>
            </div>
            <div className="bg-white p-8 rounded-2xl border-2 border-gray-200">
              <h3 className="text-2xl text-gray-900 mb-2">
                Growth
              </h3>
              <p className="text-gray-600 mb-6">
                For scaling teams
              </p>
              <div className="mb-6">
                <span className="text-5xl text-gray-900">
                  $99
                </span>
                <span className="text-gray-600">/month</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-2 text-gray-600">
                  <Check className="w-5 h-5 text-[#2ECC71]" />
                  Everything in Pro
                </li>
                <li className="flex items-center gap-2 text-gray-600">
                  <Check className="w-5 h-5 text-[#2ECC71]" />
                  Multiple startups/projects
                </li>
                <li className="flex items-center gap-2 text-gray-600">
                  <Check className="w-5 h-5 text-[#2ECC71]" />
                  Custom workflows
                </li>
                <li className="flex items-center gap-2 text-gray-600">
                  <Check className="w-5 h-5 text-[#2ECC71]" />
                  API access
                </li>
                <li className="flex items-center gap-2 text-gray-600">
                  <Check className="w-5 h-5 text-[#2ECC71]" />
                  Dedicated success manager
                </li>
              </ul>
              <button className="w-full px-6 py-3 rounded-lg border-2 border-gray-300 text-gray-900 hover:bg-gray-50 transition-colors">
                Contact Sales
              </button>
            </div>
          </div>
          <div className="text-center mt-12">
            <p className="text-gray-600">
              {"🎁 "}
              <span className="text-[#2ECC71]">Special Launch Offer:</span>
              {" First 100 signups get lifetime Pro access (save $348/year)"}
            </p>
          </div>
        </div>
      </section>
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl text-gray-900 mb-4">
              Loved by Founders
            </h2>
            <p className="text-xl text-gray-600">
              Join 500+ startup teams building the future
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-xl border border-gray-200">
              <div className="flex items-center gap-1 mb-4 text-yellow-500">
                {[...Array(5)].map((_, i) => (
                  <span key={i}>★</span>
                ))}
              </div>
              <p className="text-gray-600 mb-4">
                "The roadmap feature is incredible. Finally know what to
                prioritize instead of just guessing."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#3A5AFE] to-[#2ECC71] flex items-center justify-center text-white">
                  SH
                </div>
                <div>
                  <div className="text-sm text-gray-900">
                    Sarah H.
                  </div>
                  <div className="text-xs text-gray-600">
                    Founder, FinTech Startup
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-200">
              <div className="flex items-center gap-1 mb-4 text-yellow-500">
                {[...Array(5)].map((_, i) => (
                  <span key={i}>★</span>
                ))}
              </div>
              <p className="text-gray-600 mb-4">
                "Found my technical co-founder in 2 weeks using Smart Matching.
                Would've taken months on LinkedIn."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#3A5AFE] to-[#2ECC71] flex items-center justify-center text-white">
                  MK
                </div>
                <div>
                  <div className="text-sm text-gray-900">
                    Michael K.
                  </div>
                  <div className="text-xs text-gray-600">
                    CEO, SaaS Startup
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-200">
              <div className="flex items-center gap-1 mb-4 text-yellow-500">
                {[...Array(5)].map((_, i) => (
                  <span key={i}>★</span>
                ))}
              </div>
              <p className="text-gray-600 mb-4">
                "Saved us $3K/year by replacing Slack, Notion, and Linear. Plus
                the Virtual Office UX is beautiful."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#3A5AFE] to-[#2ECC71] flex items-center justify-center text-white">
                  JL
                </div>
                <div>
                  <div className="text-sm text-gray-900">
                    Jessica L.
                  </div>
                  <div className="text-xs text-gray-600">
                    Co-founder, AI Platform
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl text-gray-900 mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-gray-600">
              Everything you need to know about StartupVerse's unique features
            </p>
          </div>
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl border border-gray-200">
              <h3 className="text-xl text-gray-900 mb-3 flex items-start gap-3">
                <span className="text-[#3A5AFE] flex-shrink-0">Q:</span>
                <span>
                  What are the 6 stages in the Startup Journey Roadmap?
                </span>
              </h3>
              <p className="text-gray-600 ml-8">
                <span className="text-[#2ECC71]">A:</span>
                {" The roadmap guides you through: "}
                <strong>(1) Ideation & Validation</strong>
                {
                  " (1-4 weeks) with Idea Canvas, Market Research, Competitor Analysis; "
                }
                <strong>(2) Company Formation</strong>
                {
                  " (1-2 weeks) with Entity Setup, Founder Agreements, Cap Table; "
                }
                <strong>(3) Team Building</strong>
                {" (4-8 weeks) with Smart Matching and Equity Offers; "}
                <strong>(4) Product Development</strong>
                {" (8-16 weeks) with Sprint Planning and Task Management; "}
                <strong>(5) Go-to-Market</strong>
                {" (8-12 weeks) with CRM and Marketing Hub; "}
                <strong>(6) Operations & Growth</strong>
                {
                  " (12-24 weeks) with Financial Dashboard and OKR Tracking. Each stage has clear completion criteria so you know when you're ready to move forward."
                }
              </p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-200">
              <h3 className="text-xl text-gray-900 mb-3 flex items-start gap-3">
                <span className="text-[#3A5AFE] flex-shrink-0">Q:</span>
                <span>
                  What are the 35+ purpose-built tools included in StartupVerse?
                </span>
              </h3>
              <p className="text-gray-600 ml-8">
                <span className="text-[#2ECC71]">A:</span>
                {" Each roadmap stage unlocks specific tools: "}
                <strong>Stage 1:</strong>
                {
                  " Idea Canvas, Customer Interview Templates, Market Research, Competitor Analysis. "
                }
                <strong>Stage 2:</strong>
                {
                  " Entity Setup Checklist, Founder Agreement Builder, Cap Table Manager, Document Vault. "
                }
                <strong>Stage 3:</strong>
                {
                  " Smart Matching, Equity Calculator, Team Charter, Role Definitions. "
                }
                <strong>Stage 4:</strong>
                {
                  " Product Roadmap, Sprint Planner, Task Boards (Kanban), Launch Checklist, Technical Specs. "
                }
                <strong>Stage 5:</strong>
                {
                  " CRM, Sales Pipeline, Email Campaigns, Marketing Hub, Analytics Dashboard, Landing Page Builder. "
                }
                <strong>Stage 6:</strong>
                {
                  " Financial Dashboard, Budget Planner, OKR Tracker, Knowledge Base, Team Performance Metrics. All tools are interconnected and share data seamlessly."
                }
              </p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-200">
              <h3 className="text-xl text-gray-900 mb-3 flex items-start gap-3">
                <span className="text-[#3A5AFE] flex-shrink-0">Q:</span>
                <span>
                  What's the difference between Founders, Team Members, and
                  Talent roles?
                </span>
              </h3>
              <p className="text-gray-600 ml-8">
                <span className="text-[#2ECC71]">A:</span>{" "}
                <strong>Founders</strong>
                {
                  " are co-founders seeking equity partnerships (0-50% equity, full commitment). They get access to cap table management, founder agreements, and voting rights. "
                }
                <strong>Team Members</strong>
                {
                  " are full-time employees joining for salary + equity (0.1-5% equity, 40hrs/week). They receive equity offers via the Equity Calculator. "
                }
                <strong>Talent</strong>
                {
                  ' are contractors/freelancers for project-based work (hourly/project rates, no equity). The Smart Matching algorithm filters by role type so you only see relevant matches. You can switch between searching for "co-founders to build with" vs "engineers to hire."'
                }
              </p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-200">
              <h3 className="text-xl text-gray-900 mb-3 flex items-start gap-3">
                <span className="text-[#3A5AFE] flex-shrink-0">Q:</span>
                <span>How do the Virtual Office slide-out panels work?</span>
              </h3>
              <p className="text-gray-600 ml-8">
                <span className="text-[#2ECC71]">A:</span>
                {" The Virtual Office has "}
                <strong>three main panels that slide in from the right</strong>
                {": "}
                <strong>Tasks Panel (⌘T)</strong>
                {" shows your Kanban board with drag-and-drop tasks. "}
                <strong>Messages Panel (⌘M)</strong>
                {" opens team chat with direct messages and channels. "}
                <strong>Team Panel (⌘U)</strong>
                {
                  " displays your team roster, online status, and quick video call buttons. Panels overlay the workspace (they don't push content around) and can be pinned to stay open. You can have multiple panels open at once—for example, chat with someone while viewing your tasks. The spatial design mimics a real office where you can see everything at once without switching apps."
                }
              </p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-200">
              <h3 className="text-xl text-gray-900 mb-3 flex items-start gap-3">
                <span className="text-[#3A5AFE] flex-shrink-0">Q:</span>
                <span>
                  What keyboard shortcuts are available in the Virtual Office?
                </span>
              </h3>
              <p className="text-gray-600 ml-8">
                <span className="text-[#2ECC71]">A:</span>
                {" We're keyboard-first for power users: "}
                <strong>⌘T</strong>
                {" opens Tasks, "}
                <strong>⌘M</strong>
                {" opens Messages, "}
                <strong>⌘U</strong>
                {" opens Team panel, "}
                <strong>⌘K</strong>
                {" toggles Video Call overlay, "}
                <strong>⌘E</strong>
                {" opens Stage Progress (roadmap), "}
                <strong>⌘N</strong>
                {" creates new task, "}
                <strong>⌘/</strong>
                {" shows all shortcuts, "}
                <strong>⌘Shift+D</strong>
                {" toggles dark mode, "}
                <strong>Esc</strong>
                {
                  " closes panels. You can navigate your entire startup without touching the mouse. We designed it for developers and founders who live in their keyboard."
                }
              </p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-200">
              <h3 className="text-xl text-gray-900 mb-3 flex items-start gap-3">
                <span className="text-[#3A5AFE] flex-shrink-0">Q:</span>
                <span>How does the Equity Offer Builder work?</span>
              </h3>
              <p className="text-gray-600 ml-8">
                <span className="text-[#2ECC71]">A:</span>
                {" When you find a match and want to make an offer, the "}
                <strong>Equity Calculator helps you make fair offers</strong>
                {
                  " based on: (1) Role type (technical co-founder gets more than advisor), (2) Experience level (senior engineer vs junior), (3) Joining stage (earlier = more equity), (4) Market benchmarks (we show industry standards). You input: Role, Salary, Start Date, Vesting Schedule (typically 4yr/1yr cliff). The calculator suggests equity range and generates a formal offer letter. The offer is sent via StartupVerse Messages and tracked in your cap table automatically when accepted. No lawyers needed for initial offers (though we recommend legal review before signing)."
                }
              </p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-200">
              <h3 className="text-xl text-gray-900 mb-3 flex items-start gap-3">
                <span className="text-[#3A5AFE] flex-shrink-0">Q:</span>
                <span>
                  Which exact features replace Slack, Notion, Linear, Zoom, and
                  Loom?
                </span>
              </h3>
              <p className="text-gray-600 ml-8">
                <span className="text-[#2ECC71]">A:</span>
                {" Here's the feature-by-feature replacement: "}
                <strong>Slack → Messages Panel:</strong>
                {
                  " Direct messages, channels, threads, emoji reactions, file sharing, search history. "
                }
                <strong>Notion → Knowledge Base:</strong>
                {
                  " Rich text docs, nested pages, templates, @mentions, real-time collaboration. "
                }
                <strong>Linear → Task Management:</strong>
                {
                  " Kanban boards, sprints, issue tracking, priorities, assignees, due dates, custom statuses. "
                }
                <strong>Zoom → Video Calls:</strong>
                {
                  " 1-on-1 and group video, screen sharing, recording, floating overlay windows. "
                }
                <strong>Loom → Async Video:</strong>
                {
                  " Record screen + camera for team updates (coming Q2 2026). Everything is embedded in the Virtual Office—no tab switching required."
                }
              </p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-200">
              <h3 className="text-xl text-gray-900 mb-3 flex items-start gap-3">
                <span className="text-[#3A5AFE] flex-shrink-0">Q:</span>
                <span>
                  How do I know when I'm ready to move to the next roadmap
                  stage?
                </span>
              </h3>
              <p className="text-gray-600 ml-8">
                <span className="text-[#2ECC71]">A:</span>
                {" Each stage has "}
                <strong>clear completion criteria</strong>
                {" (not just a checklist—actual validation): "}
                <strong>Stage 1:</strong>
                {
                  " 10+ customer interviews completed, clear problem statement, validated market size. "
                }
                <strong>Stage 2:</strong>
                {
                  " Company incorporated, founder agreements signed, cap table created. "
                }
                <strong>Stage 3:</strong>
                {
                  " Core team assembled (at least 2-3 people), roles defined, team charter agreed. "
                }
                <strong>Stage 4:</strong>
                {" MVP shipped, first users onboarded, core features working. "}
                <strong>Stage 5:</strong>
                {
                  " First paying customers, repeatable sales process, product-market fit signals. "
                }
                <strong>Stage 6:</strong>
                {
                  " $10K+ MRR, positive unit economics, documented processes. The dashboard shows your progress with a completion percentage and suggests when you're ready to advance. You can skip stages or customize criteria for your specific startup type."
                }
              </p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-200">
              <h3 className="text-xl text-gray-900 mb-3 flex items-start gap-3">
                <span className="text-[#3A5AFE] flex-shrink-0">Q:</span>
                <span>
                  Does StartupVerse include analytics and compensation tracking?
                </span>
              </h3>
              <p className="text-gray-600 ml-8">
                <span className="text-[#2ECC71]">A:</span>
                {" Yes! The platform includes "}
                <strong>built-in real-time analytics</strong>
                {
                  " tracking team velocity, task completion rates, blocker patterns, and stage progression. You can also set up "
                }
                <strong>compensation contracts</strong>
                {
                  " for team members with flexible models (equity-only, hourly, fixed payments, or hybrid) that automatically track performance thresholds and handle vesting calculations. All metrics are algorithm-powered with no manual data entry required."
                }
              </p>
            </div>
          </div>
          <div className="mt-12 text-center">
            <p className="text-gray-600 mb-4">
              Still have questions about our features?
            </p>
            <button className="px-6 py-3 rounded-lg border-2 border-[#3A5AFE] text-[#3A5AFE] hover:bg-[#3A5AFE] hover:text-white transition-colors">
              Contact Support
            </button>
          </div>
        </div>
      </section>
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-[#3A5AFE] to-[#2ECC71]">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl sm:text-5xl text-white mb-6">
            Ready to Build Your Startup?
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Join 500+ founders using StartupVerse to go from idea to launch
          </p>
          {isSubmitted ? (
            <div className="inline-flex items-center gap-2 px-8 py-4 rounded-lg bg-white text-[#2ECC71]">
              <Check className="w-6 h-6" />
              <span className="text-lg">
                You're on the waitlist! Check your email.
              </span>
            </div>
          ) : (
            <form
              onSubmit={handleWaitlistSubmit}
              className="flex flex-col sm:flex-row gap-4 justify-center max-w-lg mx-auto"
            >
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required={true}
                className="px-6 py-4 rounded-lg border-2 border-white/20 bg-white/10 backdrop-blur-sm text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white flex-1"
              />
              <button
                type="submit"
                className="px-8 py-4 rounded-lg bg-white text-[#3A5AFE] hover:bg-gray-100 transition-colors text-lg inline-flex items-center justify-center gap-2 whitespace-nowrap"
              >
                Get Started Free
                <ArrowRight className="w-5 h-5" />
              </button>
            </form>
          )}
          <div className="mt-6 flex items-center justify-center gap-8 text-white/80 text-sm">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4" />
              <span>Free for teams up to 5</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4" />
              <span>No credit card required</span>
            </div>
          </div>
        </div>
      </section>
      <footer className="py-12 px-4 sm:px-6 lg:px-8 bg-primary-dark text-primary-foreground/80">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#3A5AFE] to-[#2ECC71] flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <span className="text-white">StartupVerse</span>
              </div>
              <p className="text-sm">
                Everything you need to build your startup: Roadmap, Team,
                Workspace, Tools—with built-in analytics and compensation
                tracking.
              </p>
            </div>
            <div>
              <h4 className="text-white mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a
                    href="#features"
                    className="hover:text-white transition-colors"
                  >
                    Features
                  </a>
                </li>
                <li>
                  <a
                    href="#pricing"
                    className="hover:text-white transition-colors"
                  >
                    Pricing
                  </a>
                </li>
                <li>
                  <a
                    href="#how-it-works"
                    className="hover:text-white transition-colors"
                  >
                    How It Works
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-white mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    About
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Blog
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Careers
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-white mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Privacy
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Terms
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Security
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-gray-800 text-center text-sm">
            <p>© 2026 StartupVerse. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
