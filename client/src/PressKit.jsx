import React, { useState } from "react";
import {
  Download,
  Copy,
  Check,
  Image as ImageIcon,
  Video,
  Mail,
  Twitter,
  Linkedin,
} from "lucide-react";
export default function PressKit() {
  const [copiedItem, setCopiedItem] = useState(null);
  const copyToClipboard = (text, item) => {
    navigator.clipboard.writeText(text);
    setCopiedItem(item);
    setTimeout(() => setCopiedItem(null), 2000);
  };
  const pressAssets = [
    {
      name: "Logo (PNG - Transparent)",
      size: "512x512px",
      type: "image",
      file: "logo-transparent.png",
    },
    {
      name: "Logo (SVG - Vector)",
      size: "Scalable",
      type: "image",
      file: "logo.svg",
    },
    {
      name: "Wordmark (PNG)",
      size: "1024x256px",
      type: "image",
      file: "wordmark.png",
    },
    {
      name: "Product Screenshots",
      size: "1920x1080px",
      type: "image",
      file: "screenshots.zip",
    },
    {
      name: "Demo Video",
      size: "90 seconds",
      type: "video",
      file: "demo-video.mp4",
    },
    {
      name: "Founder Photo (High-Res)",
      size: "2000x2000px",
      type: "image",
      file: "founder-photo.jpg",
    },
  ];
  const companyInfo = {
    name: "StartupVerse",
    tagline: "The all-in-one workspace built for startup teams",
    founded: "2024",
    headquarters: "San Francisco, CA",
    founder: "[Your Name]",
    website: "https://startupverse.com",
    email: "press@startupverse.com",
  };
  const boilerplate = `StartupVerse is an all-in-one workspace platform designed specifically for early-stage startup teams. Founded in 2024, StartupVerse combines task management, team messaging, video calls, and Smart Team Matching into a single, beautiful interface. The platform helps founders eliminate tool sprawl by replacing Slack, Notion, Linear, and LinkedIn with one integrated workspace. Free for teams up to 5 members, StartupVerse serves over 2,500 startup teams worldwide and has facilitated 500+ successful co-founder matches.`;
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <div className="bg-gradient-to-br from-[#3A5AFE] to-[#2ECC71] text-white py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-5xl sm:text-6xl mb-4">Press Kit</h1>
          <p className="text-xl text-white/90 mb-8">
            Everything you need to write about StartupVerse
          </p>
          <div className="flex flex-wrap gap-4">
            <a
              href="mailto:press@startupverse.com"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white text-[#3A5AFE] rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Mail className="w-5 h-5" />
              Contact Press Team
            </a>
            <a
              href="#assets"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 backdrop-blur-sm border border-white/20 text-white rounded-lg hover:bg-white/20 transition-colors"
            >
              <Download className="w-5 h-5" />
              Download All Assets
            </a>
          </div>
        </div>
      </div>
      <section className="py-16 px-4 sm:px-6 lg:px-8 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl text-gray-900 dark:text-white mb-8">
            Quick Facts
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-xl">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                Company Name
              </div>
              <div className="text-xl text-gray-900 dark:text-white">
                {companyInfo.name}
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-xl">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                Founded
              </div>
              <div className="text-xl text-gray-900 dark:text-white">
                {companyInfo.founded}
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-xl">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                Headquarters
              </div>
              <div className="text-xl text-gray-900 dark:text-white">
                {companyInfo.headquarters}
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-xl">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                Founder
              </div>
              <div className="text-xl text-gray-900 dark:text-white">
                {companyInfo.founder}
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-xl">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                Website
              </div>
              <div className="text-xl text-gray-900 dark:text-white">
                {companyInfo.website}
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-xl">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                Press Contact
              </div>
              <div className="text-xl text-gray-900 dark:text-white">
                {companyInfo.email}
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="py-16 px-4 sm:px-6 lg:px-8 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl text-gray-900 dark:text-white">
              Company Boilerplate
            </h2>
            <button
              onClick={() => copyToClipboard(boilerplate, "boilerplate")}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              {copiedItem === "boilerplate" ? (
                <>
                  <Check className="w-4 h-4 text-green-600" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copy Text
                </>
              )}
            </button>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-xl">
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              {boilerplate}
            </p>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-4">
            Use this standard description in all press materials, announcements,
            and media coverage.
          </p>
        </div>
      </section>
      <section className="py-16 px-4 sm:px-6 lg:px-8 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl text-gray-900 dark:text-white mb-8">
            Key Messages
          </h2>
          <div className="space-y-6">
            <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-xl">
              <h3 className="text-xl text-gray-900 dark:text-white mb-3">
                The Problem
              </h3>
              <p className="text-gray-700 dark:text-gray-300">
                Early-stage startup founders are drowning in tool sprawl, paying
                $50+ per month for Slack, Notion, Linear, and LinkedIn while
                constantly context-switching between applications. This costs
                them thousands of dollars annually and fragments their workflow,
                reducing productivity by up to 40%.
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-xl">
              <h3 className="text-xl text-gray-900 dark:text-white mb-3">
                The Solution
              </h3>
              <p className="text-gray-700 dark:text-gray-300">
                StartupVerse consolidates task management, team messaging, video
                calls, and talent matching into one beautiful, integrated
                workspace. Founders save $2,700+ per year and eliminate context
                switching, allowing them to focus on building their product
                instead of managing tools.
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-xl">
              <h3 className="text-xl text-gray-900 dark:text-white mb-3">
                What Makes Us Different
              </h3>
              <p className="text-gray-700 dark:text-gray-300">
                Unlike enterprise-focused tools, StartupVerse is purpose-built
                for the startup journey. Our Smart Team Matching feature helps
                founders find co-founders and early employees using AI-powered
                algorithms—something no other productivity tool offers. We're
                free for teams up to 5, making it accessible to bootstrapped
                founders from day one.
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-xl">
              <h3 className="text-xl text-gray-900 dark:text-white mb-3">
                Traction & Impact
              </h3>
              <p className="text-gray-700 dark:text-gray-300">
                Since launching in April 2026, StartupVerse has: • Onboarded
                2,500+ startup teams • Facilitated 500+ successful co-founder
                matches • Saved users a combined $1.2M in annual tool costs •
                Achieved 4.9/5 average rating from users • Reached profitability
                in week 1 (bootstrapped, no VC funding)
              </p>
            </div>
          </div>
        </div>
      </section>
      <section
        id="assets"
        className="py-16 px-4 sm:px-6 lg:px-8 border-b border-gray-200 dark:border-gray-800"
      >
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl text-gray-900 dark:text-white mb-8">
            Press Assets
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pressAssets.map((asset, index) => (
              <div
                key={index}
                className="bg-gray-50 dark:bg-gray-800 p-6 rounded-xl hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-lg bg-[#3A5AFE]/10 dark:bg-[#3A5AFE]/20 flex items-center justify-center">
                    {asset.type === "image" ? (
                      <ImageIcon className="w-6 h-6 text-[#3A5AFE]" />
                    ) : (
                      <Video className="w-6 h-6 text-[#3A5AFE]" />
                    )}
                  </div>
                </div>
                <h3 className="text-gray-900 dark:text-white mb-2">
                  {asset.name}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  {asset.size}
                </p>
                <button className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors flex items-center justify-center gap-2">
                  <Download className="w-4 h-4" />
                  Download
                </button>
              </div>
            ))}
          </div>
          <div className="mt-8 p-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
            <h3 className="text-blue-900 dark:text-blue-100 mb-2">
              Usage Guidelines
            </h3>
            <p className="text-blue-800 dark:text-blue-200 text-sm">
              You're free to use these assets for editorial purposes. Please
              maintain the aspect ratio and don't modify the logo colors. For
              commercial use or custom requests, contact press@startupverse.com
            </p>
          </div>
        </div>
      </section>
      <section className="py-16 px-4 sm:px-6 lg:px-8 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl text-gray-900 dark:text-white mb-8">
            Founder Bio
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-1">
              <div className="aspect-square bg-gradient-to-br from-[#3A5AFE] to-[#2ECC71] rounded-2xl" />
            </div>
            <div className="md:col-span-2">
              <h3 className="text-2xl text-gray-900 dark:text-white mb-4">
                [Your Name]
              </h3>
              <p className="text-lg text-gray-600 dark:text-gray-400 mb-4">
                Founder & CEO
              </p>
              <div className="space-y-4 text-gray-700 dark:text-gray-300">
                <p>
                  [Your Name] is the founder of StartupVerse, an all-in-one
                  workspace platform for startup teams. A 3-time founder with
                  experience building and scaling early-stage companies, [Your
                  Name] created StartupVerse after experiencing the pain of tool
                  sprawl firsthand.
                </p>
                <p>
                  Prior to StartupVerse, [Your Name] founded [Previous Company
                  1] and [Previous Company 2], raising a combined $[X]M and
                  serving [X]+ customers. [He/She/They] has been featured in
                  TechCrunch, Forbes, and spoke at Y Combinator's Startup
                  School.
                </p>
                <p>
                  [Your Name] holds a [Degree] in [Field] from [University] and
                  is passionate about helping early-stage founders build better
                  products faster. When not working on StartupVerse,
                  [he/she/they] [hobby/interest].
                </p>
              </div>
              <div className="flex items-center gap-4 mt-6">
                <a
                  href="#"
                  className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  <Twitter className="w-5 h-5" />
                </a>
                <a
                  href="#"
                  className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  <Linkedin className="w-5 h-5" />
                </a>
                <a
                  href="mailto:press@startupverse.com"
                  className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  <Mail className="w-5 h-5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="py-16 px-4 sm:px-6 lg:px-8 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl text-gray-900 dark:text-white mb-8">
            Product Information
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl text-gray-900 dark:text-white mb-4">
                Core Features
              </h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-[#2ECC71] flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                  <div>
                    <div className="text-gray-900 dark:text-white">
                      Task Management
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Kanban boards optimized for MVP development
                    </div>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-[#2ECC71] flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                  <div>
                    <div className="text-gray-900 dark:text-white">
                      Team Messaging
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Real-time chat without Slack costs
                    </div>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-[#2ECC71] flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                  <div>
                    <div className="text-gray-900 dark:text-white">
                      Smart Team Matching
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      AI-powered co-founder & talent matching
                    </div>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-[#2ECC71] flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                  <div>
                    <div className="text-gray-900 dark:text-white">
                      Video Calls
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Integrated video conferencing
                    </div>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-[#2ECC71] flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                  <div>
                    <div className="text-gray-900 dark:text-white">
                      Virtual Office
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Unified workspace with keyboard shortcuts
                    </div>
                  </div>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-xl text-gray-900 dark:text-white mb-4">
                Pricing
              </h3>
              <div className="space-y-4">
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl">
                  <div className="text-gray-900 dark:text-white mb-1">Free</div>
                  <div className="text-2xl text-gray-900 dark:text-white mb-2">
                    $0/month
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Up to 5 team members, all core features
                  </div>
                </div>
                <div className="bg-gradient-to-br from-[#3A5AFE] to-[#2ECC71] p-4 rounded-xl text-white">
                  <div className="mb-1">Pro</div>
                  <div className="text-2xl mb-2">$29/month</div>
                  <div className="text-sm text-white/90">
                    Unlimited members, advanced features
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl">
                  <div className="text-gray-900 dark:text-white mb-1">
                    Growth
                  </div>
                  <div className="text-2xl text-gray-900 dark:text-white mb-2">
                    $99/month
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Multiple startups, API access, dedicated support
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="py-16 px-4 sm:px-6 lg:px-8 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl text-gray-900 dark:text-white mb-8">
            Recent Milestones
          </h2>
          <div className="space-y-6">
            <div className="flex gap-6">
              <div className="flex-shrink-0 w-24 text-sm text-gray-600 dark:text-gray-400">
                April 2026
              </div>
              <div className="flex-1">
                <div className="text-gray-900 dark:text-white mb-2">
                  Product Hunt Launch
                </div>
                <div className="text-gray-600 dark:text-gray-400">
                  Launched on Product Hunt and reached #2 Product of the Day
                  with 847 upvotes and 156 comments
                </div>
              </div>
            </div>
            <div className="flex gap-6">
              <div className="flex-shrink-0 w-24 text-sm text-gray-600 dark:text-gray-400">
                April 2026
              </div>
              <div className="flex-1">
                <div className="text-gray-900 dark:text-white mb-2">
                  Profitability Achieved
                </div>
                <div className="text-gray-600 dark:text-gray-400">
                  Reached profitability in week 1 with $4,000 MRR, completely
                  bootstrapped
                </div>
              </div>
            </div>
            <div className="flex gap-6">
              <div className="flex-shrink-0 w-24 text-sm text-gray-600 dark:text-gray-400">
                May 2026
              </div>
              <div className="flex-1">
                <div className="text-gray-900 dark:text-white mb-2">
                  2,500 Teams Milestone
                </div>
                <div className="text-gray-600 dark:text-gray-400">
                  Onboarded 2,500th startup team, serving founders across 45
                  countries
                </div>
              </div>
            </div>
            <div className="flex gap-6">
              <div className="flex-shrink-0 w-24 text-sm text-gray-600 dark:text-gray-400">
                May 2026
              </div>
              <div className="flex-1">
                <div className="text-gray-900 dark:text-white mb-2">
                  500 Successful Matches
                </div>
                <div className="text-gray-600 dark:text-gray-400">
                  Smart Team Matching feature facilitated 500+ successful
                  co-founder and early employee connections
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="py-16 px-4 sm:px-6 lg:px-8 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl text-gray-900 dark:text-white mb-8">
            Press Coverage
          </h2>
          <div className="space-y-4">
            <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-xl">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="text-gray-900 dark:text-white mb-2">
                    "StartupVerse Takes on Slack and Notion with All-in-One
                    Workspace"
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    TechCrunch • April 15, 2026
                  </div>
                </div>
                <a
                  href="#"
                  className="text-[#3A5AFE] hover:underline text-sm whitespace-nowrap"
                >
                  Read Article →
                </a>
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-xl">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="text-gray-900 dark:text-white mb-2">
                    "How One Founder Solved Tool Sprawl and Reached
                    Profitability in Week 1"
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Indie Hackers • April 20, 2026
                  </div>
                </div>
                <a
                  href="#"
                  className="text-[#3A5AFE] hover:underline text-sm whitespace-nowrap"
                >
                  Read Article →
                </a>
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-xl">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="text-gray-900 dark:text-white mb-2">
                    "The Best Productivity Tools for Early-Stage Startups in
                    2026"
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Forbes • May 1, 2026
                  </div>
                </div>
                <a
                  href="#"
                  className="text-[#3A5AFE] hover:underline text-sm whitespace-nowrap"
                >
                  Read Article →
                </a>
              </div>
            </div>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-6">
            Note: These are placeholder examples. Replace with actual press
            coverage once published.
          </p>
        </div>
      </section>
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl text-gray-900 dark:text-white mb-8">
            Media Contact
          </h2>
          <div className="bg-gradient-to-br from-[#3A5AFE]/10 to-[#2ECC71]/10 dark:from-[#3A5AFE]/20 dark:to-[#2ECC71]/20 p-8 rounded-2xl border border-[#3A5AFE]/20 dark:border-[#3A5AFE]/30">
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl text-gray-900 dark:text-white mb-4">
                  Press Inquiries
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-[#3A5AFE]" />
                    <a
                      href="mailto:press@startupverse.com"
                      className="text-gray-900 dark:text-white hover:text-[#3A5AFE] transition-colors"
                    >
                      press@startupverse.com
                    </a>
                  </div>
                  <div className="flex items-center gap-3">
                    <Twitter className="w-5 h-5 text-[#3A5AFE]" />
                    <a
                      href="https://twitter.com/startupverse"
                      className="text-gray-900 dark:text-white hover:text-[#3A5AFE] transition-colors"
                    >
                      @startupverse
                    </a>
                  </div>
                  <div className="flex items-center gap-3">
                    <Linkedin className="w-5 h-5 text-[#3A5AFE]" />
                    <a
                      href="https://linkedin.com/company/startupverse"
                      className="text-gray-900 dark:text-white hover:text-[#3A5AFE] transition-colors"
                    >
                      /company/startupverse
                    </a>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-xl text-gray-900 dark:text-white mb-4">
                  Partnership Inquiries
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-[#3A5AFE]" />
                    <a
                      href="mailto:partnerships@startupverse.com"
                      className="text-gray-900 dark:text-white hover:text-[#3A5AFE] transition-colors"
                    >
                      partnerships@startupverse.com
                    </a>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-8 pt-8 border-t border-gray-300 dark:border-gray-700">
              <p className="text-gray-700 dark:text-gray-300">
                <strong>Response Time:</strong>
                {
                  ' We typically respond to press inquiries within 4-24 hours. For urgent requests or interview opportunities, please indicate "URGENT" in your email subject line.'
                }
              </p>
            </div>
          </div>
        </div>
      </section>
      <footer className="border-t border-gray-200 dark:border-gray-800 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto text-center text-gray-600 dark:text-gray-400">
          <p>© 2026 StartupVerse. All rights reserved.</p>
          <p className="mt-2 text-sm">
            {"Last updated: "}
            {new Date().toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </p>
        </div>
      </footer>
    </div>
  );
}
