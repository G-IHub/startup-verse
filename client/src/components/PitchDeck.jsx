import React, { useState, useEffect } from "react";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Badge } from "./ui/badge";
import {
  ChevronLeft,
  ChevronRight,
  Save,
  Download,
  Presentation,
  Edit3,
  Check,
  X,
  Eye,
  TrendingUp,
  Target,
  Users,
  DollarSign,
  Award,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
const INITIAL_DATA = {
  companyName: "",
  tagline: "",
  founderName: "",
  founderTitle: "CEO & Founder",
  email: "",
  website: "",
  problemTitle: "The Problem",
  problemDescription: "",
  problemStats: ["", "", "", ""],
  problemQuote: "",
  solutionTitle: "The Solution",
  solutionDescription: "",
  keyFeatures: ["", "", "", ""],
  whyNowTitle: "Why Now?",
  marketTrends: [
    {
      trend: "",
      description: "",
    },
    {
      trend: "",
      description: "",
    },
    {
      trend: "",
      description: "",
    },
  ],
  tam: "",
  tamDescription: "",
  sam: "",
  samDescription: "",
  som: "",
  somDescription: "",
  productDescription: "",
  productSteps: [
    {
      title: "Step 1",
      description: "",
    },
    {
      title: "Step 2",
      description: "",
    },
    {
      title: "Step 3",
      description: "",
    },
  ],
  primaryRevenue: "",
  pricingTiers: [
    {
      name: "Free",
      price: "$0",
      features: "",
    },
    {
      name: "Pro",
      price: "$29/mo",
      features: "",
    },
    {
      name: "Enterprise",
      price: "$99/mo",
      features: "",
    },
  ],
  cac: "",
  ltv: "",
  margin: "",
  userGrowth: "",
  revenue: "",
  retention: "",
  milestones: ["", "", "", ""],
  testimonial: "",
  competitors: [
    {
      name: "",
      description: "",
    },
    {
      name: "",
      description: "",
    },
    {
      name: "",
      description: "",
    },
  ],
  uniqueAdvantages: ["", "", "", ""],
  targetSegments: ["", "", ""],
  acquisitionChannels: [
    {
      channel: "Organic",
      percentage: "",
    },
    {
      channel: "Paid",
      percentage: "",
    },
    {
      channel: "Partnerships",
      percentage: "",
    },
  ],
  conversionRate: "",
  year1Revenue: "",
  year2Revenue: "",
  year3Revenue: "",
  year4Revenue: "",
  year5Revenue: "",
  keyAssumptions: ["", "", "", ""],
  teamMembers: [
    {
      name: "",
      title: "",
      background: "",
    },
    {
      name: "",
      title: "",
      background: "",
    },
    {
      name: "",
      title: "",
      background: "",
    },
  ],
  advisors: ["", "", ""],
  raisingAmount: "",
  valuation: "",
  useOfFunds: [
    {
      category: "Product & Engineering",
      percentage: "40",
      description: "",
    },
    {
      category: "Marketing & Sales",
      percentage: "35",
      description: "",
    },
    {
      category: "Operations & Team",
      percentage: "20",
      description: "",
    },
    {
      category: "Legal & Admin",
      percentage: "5",
      description: "",
    },
  ],
  milestones: ["", "", "", ""],
  runway: "",
};
export default function PitchDeck({ user, onBack }) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [data, setData] = useState(INITIAL_DATA);
  const [editMode, setEditMode] = useState(true);
  const [presentationMode, setPresentationMode] = useState(false);

  // Load saved data
  useEffect(() => {
    const saved = localStorage.getItem(`pitch_deck_${user.id}`);
    if (saved) {
      setData(JSON.parse(saved));
    } else if (user.profile) {
      // Pre-fill with profile data
      setData((prev) => ({
        ...prev,
        companyName: user.profile.startupName || "",
        founderName: user.name || "",
        email: user.email || "",
        problemDescription: user.profile.problemStatement || "",
        solutionDescription: user.profile.solutionDescription || "",
      }));
    }
  }, [user]);
  const saveData = () => {
    localStorage.setItem(`pitch_deck_${user.id}`, JSON.stringify(data));
    toast.success("Pitch deck saved!");
  };
  const updateData = (field, value) => {
    setData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };
  const nextSlide = () => {
    if (currentSlide < 12) setCurrentSlide(currentSlide + 1);
  };
  const prevSlide = () => {
    if (currentSlide > 0) setCurrentSlide(currentSlide - 1);
  };
  const exportToPDF = () => {
    toast.success("PDF export coming soon!", {
      description: "This feature will be available in the next update.",
    });
  };

  // Slide 1: Cover
  const renderCoverSlide = () => (
    <div className="h-full flex flex-col items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5 p-12">
      <div className="text-center space-y-6 max-w-2xl">
        {editMode ? (
          <>
            <Input
              placeholder="Company Name"
              value={data.companyName}
              onChange={(e) => updateData("companyName", e.target.value)}
              className="text-center text-5xl font-bold border-2 border-dashed"
            />
            <Input
              placeholder="Your compelling tagline in one sentence"
              value={data.tagline}
              onChange={(e) => updateData("tagline", e.target.value)}
              className="text-center text-2xl border-2 border-dashed"
            />
            <div className="grid grid-cols-2 gap-4 mt-8">
              <Input
                placeholder="Founder Name"
                value={data.founderName}
                onChange={(e) => updateData("founderName", e.target.value)}
              />
              <Input
                placeholder="Title"
                value={data.founderTitle}
                onChange={(e) => updateData("founderTitle", e.target.value)}
              />
              <Input
                placeholder="Email"
                value={data.email}
                onChange={(e) => updateData("email", e.target.value)}
              />
              <Input
                placeholder="Website"
                value={data.website}
                onChange={(e) => updateData("website", e.target.value)}
              />
            </div>
          </>
        ) : (
          <>
            <h1 className="text-6xl font-bold text-primary mb-4">
              {data.companyName || "Your Company"}
            </h1>
            <p className="text-3xl text-muted-foreground mb-12">
              {data.tagline || "Your compelling tagline"}
            </p>
            <div className="space-y-2 text-lg">
              <p className="font-semibold">
                {data.founderName || "Founder Name"}
                {", "}
                {data.founderTitle}
              </p>
              <p className="text-muted-foreground">
                {data.email}
                {" | "}
                {data.website}
              </p>
              <p className="text-sm text-muted-foreground mt-4">
                {new Date().toLocaleDateString("en-US", {
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );

  // Slide 2: Problem
  const renderProblemSlide = () => (
    <div className="h-full p-12 space-y-6">
      <div className="mb-8">
        <Badge className="mb-4">Slide 2</Badge>
        {editMode ? (
          <Input
            value={data.problemTitle}
            onChange={(e) => updateData("problemTitle", e.target.value)}
            className="text-4xl font-bold border-2 border-dashed mb-4"
          />
        ) : (
          <h2 className="text-4xl font-bold mb-4">{data.problemTitle}</h2>
        )}
      </div>
      {editMode ? (
        <div className="space-y-4">
          <div>
            <Label>Problem Description</Label>
            <Textarea
              placeholder="Clearly describe the pain point in detail..."
              value={data.problemDescription}
              onChange={(e) => updateData("problemDescription", e.target.value)}
              className="min-h-[100px]"
            />
          </div>
          <div>
            <Label>Key Statistics (4 bullet points with data)</Label>
            {data.problemStats.map((stat, i) => (
              <Input
                key={i}
                placeholder={`Statistic ${i + 1} (e.g., "90% of startups fail in 5 years")`}
                value={stat}
                onChange={(e) => {
                  const newStats = [...data.problemStats];
                  newStats[i] = e.target.value;
                  updateData("problemStats", newStats);
                }}
                className="mb-2"
              />
            ))}
          </div>
          <div>
            <Label>Customer Quote</Label>
            <Input
              placeholder={'"Quote from customer about the problem"'}
              value={data.problemQuote}
              onChange={(e) => updateData("problemQuote", e.target.value)}
            />
          </div>
        </div>
      ) : (
        <>
          <p className="text-xl text-muted-foreground leading-relaxed mb-8">
            {data.problemDescription ||
              "Describe the problem your startup is solving..."}
          </p>
          <div className="grid grid-cols-2 gap-6 mb-8">
            {data.problemStats
              .filter((s) => s)
              .map((stat, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                  <p className="text-lg">{stat}</p>
                </div>
              ))}
          </div>
          {data.problemQuote && (
            <div className="bg-primary/5 p-6 rounded-lg border-l-4 border-primary">
              <p className="text-lg italic">"{data.problemQuote}"</p>
            </div>
          )}
        </>
      )}
    </div>
  );

  // Slide 3: Solution
  const renderSolutionSlide = () => (
    <div className="h-full p-12 space-y-6">
      <div className="mb-8">
        <Badge className="mb-4">Slide 3</Badge>
        {editMode ? (
          <Input
            value={data.solutionTitle}
            onChange={(e) => updateData("solutionTitle", e.target.value)}
            className="text-4xl font-bold border-2 border-dashed mb-4"
          />
        ) : (
          <h2 className="text-4xl font-bold mb-4">{data.solutionTitle}</h2>
        )}
      </div>
      {editMode ? (
        <div className="space-y-4">
          <div>
            <Label>Solution Description</Label>
            <Textarea
              placeholder="How does your product solve the problem?"
              value={data.solutionDescription}
              onChange={(e) =>
                updateData("solutionDescription", e.target.value)
              }
              className="min-h-[100px]"
            />
          </div>
          <div>
            <Label>Key Features & Benefits (4 items)</Label>
            {data.keyFeatures.map((feature, i) => (
              <Input
                key={i}
                placeholder={`Feature ${i + 1} and its benefit`}
                value={feature}
                onChange={(e) => {
                  const newFeatures = [...data.keyFeatures];
                  newFeatures[i] = e.target.value;
                  updateData("keyFeatures", newFeatures);
                }}
                className="mb-2"
              />
            ))}
          </div>
        </div>
      ) : (
        <>
          <p className="text-xl text-muted-foreground leading-relaxed mb-8">
            {data.solutionDescription || "Describe your solution..."}
          </p>
          <div className="grid grid-cols-2 gap-6">
            {data.keyFeatures
              .filter((f) => f)
              .map((feature, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 p-4 bg-primary/5 rounded-lg"
                >
                  <Check className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                  <p className="text-lg">{feature}</p>
                </div>
              ))}
          </div>
        </>
      )}
    </div>
  );

  // Slide 4: Why Now
  const renderWhyNowSlide = () => (
    <div className="h-full p-12 space-y-6">
      <div className="mb-8">
        <Badge className="mb-4">Slide 4</Badge>
        <h2 className="text-4xl font-bold mb-4">Why Now?</h2>
        <p className="text-xl text-muted-foreground">The Perfect Storm</p>
      </div>
      {editMode ? (
        <div className="space-y-4">
          {data.marketTrends.map((trend, i) => (
            <div
              key={i}
              className="p-4 border-2 border-dashed rounded-lg space-y-2"
            >
              <Input
                placeholder={`Trend ${i + 1} (e.g., "Remote Work Revolution")`}
                value={trend.trend}
                onChange={(e) => {
                  const newTrends = [...data.marketTrends];
                  newTrends[i] = {
                    ...trend,
                    trend: e.target.value,
                  };
                  updateData("marketTrends", newTrends);
                }}
              />
              <Textarea
                placeholder="Describe this trend and supporting data..."
                value={trend.description}
                onChange={(e) => {
                  const newTrends = [...data.marketTrends];
                  newTrends[i] = {
                    ...trend,
                    description: e.target.value,
                  };
                  updateData("marketTrends", newTrends);
                }}
                className="min-h-[80px]"
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {data.marketTrends
            .filter((t) => t.trend)
            .map((trend, i) => (
              <div key={i} className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-primary" />
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold mb-2">{trend.trend}</h3>
                  <p className="text-muted-foreground">{trend.description}</p>
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );

  // Slide 5: Market Size
  const renderMarketSizeSlide = () => (
    <div className="h-full p-12 space-y-8">
      <div className="mb-8">
        <Badge className="mb-4">Slide 5</Badge>
        <h2 className="text-4xl font-bold mb-4">Market Opportunity</h2>
      </div>
      {editMode ? (
        <div className="space-y-6">
          <div className="p-4 border-2 border-dashed rounded-lg space-y-2">
            <Label>TAM - Total Addressable Market</Label>
            <Input
              placeholder="e.g., $50 Billion"
              value={data.tam}
              onChange={(e) => updateData("tam", e.target.value)}
            />
            <Textarea
              placeholder="Describe the total market..."
              value={data.tamDescription}
              onChange={(e) => updateData("tamDescription", e.target.value)}
            />
          </div>
          <div className="p-4 border-2 border-dashed rounded-lg space-y-2">
            <Label>SAM - Serviceable Addressable Market</Label>
            <Input
              placeholder="e.g., $5 Billion"
              value={data.sam}
              onChange={(e) => updateData("sam", e.target.value)}
            />
            <Textarea
              placeholder="Segment you can reach..."
              value={data.samDescription}
              onChange={(e) => updateData("samDescription", e.target.value)}
            />
          </div>
          <div className="p-4 border-2 border-dashed rounded-lg space-y-2">
            <Label>SOM - Serviceable Obtainable Market</Label>
            <Input
              placeholder="e.g., $50 Million (Year 3)"
              value={data.som}
              onChange={(e) => updateData("som", e.target.value)}
            />
            <Textarea
              placeholder="What you can realistically capture..."
              value={data.somDescription}
              onChange={(e) => updateData("somDescription", e.target.value)}
            />
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center">
          <div className="space-y-6 max-w-3xl w-full">
            <div className="text-center p-8 bg-primary/5 rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">
                TAM - Total Addressable Market
              </p>
              <p className="text-5xl font-bold text-primary mb-4">
                {data.tam || "$50B"}
              </p>
              <p className="text-muted-foreground">{data.tamDescription}</p>
            </div>
            <div className="text-center p-8 bg-primary/10 rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">
                SAM - Serviceable Addressable Market
              </p>
              <p className="text-4xl font-bold text-primary mb-4">
                {data.sam || "$5B"}
              </p>
              <p className="text-muted-foreground">{data.samDescription}</p>
            </div>
            <div className="text-center p-8 bg-primary/20 rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">
                SOM - Serviceable Obtainable Market
              </p>
              <p className="text-3xl font-bold text-primary mb-4">
                {data.som || "$50M"}
              </p>
              <p className="text-muted-foreground">{data.somDescription}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // Slide 6: Product
  const renderProductSlide = () => (
    <div className="h-full p-12 space-y-6">
      <div className="mb-8">
        <Badge className="mb-4">Slide 6</Badge>
        <h2 className="text-4xl font-bold mb-4">How It Works</h2>
      </div>
      {editMode ? (
        <div className="space-y-4">
          <div>
            <Label>Product Overview</Label>
            <Textarea
              placeholder="Brief overview of your product..."
              value={data.productDescription}
              onChange={(e) => updateData("productDescription", e.target.value)}
              className="min-h-[100px]"
            />
          </div>
          {data.productSteps.map((step, i) => (
            <div
              key={i}
              className="p-4 border-2 border-dashed rounded-lg space-y-2"
            >
              <Input
                placeholder={`Step ${i + 1} Title`}
                value={step.title}
                onChange={(e) => {
                  const newSteps = [...data.productSteps];
                  newSteps[i] = {
                    ...step,
                    title: e.target.value,
                  };
                  updateData("productSteps", newSteps);
                }}
              />
              <Textarea
                placeholder="Describe this step..."
                value={step.description}
                onChange={(e) => {
                  const newSteps = [...data.productSteps];
                  newSteps[i] = {
                    ...step,
                    description: e.target.value,
                  };
                  updateData("productSteps", newSteps);
                }}
              />
            </div>
          ))}
        </div>
      ) : (
        <>
          <p className="text-xl text-muted-foreground mb-8">
            {data.productDescription}
          </p>
          <div className="space-y-6">
            {data.productSteps
              .filter((s) => s.description)
              .map((step, i) => (
                <div key={i} className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center text-xl font-bold">
                      {i + 1}
                    </div>
                  </div>
                  <div className="flex-1 pt-2">
                    <h3 className="text-2xl font-semibold mb-2">
                      {step.title}
                    </h3>
                    <p className="text-muted-foreground text-lg">
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
          </div>
        </>
      )}
    </div>
  );

  // Slide 7: Business Model
  const renderBusinessModelSlide = () => (
    <div className="h-full p-12 space-y-6">
      <div className="mb-8">
        <Badge className="mb-4">Slide 7</Badge>
        <h2 className="text-4xl font-bold mb-4">Business Model</h2>
      </div>
      {editMode ? (
        <div className="space-y-4">
          <div>
            <Label>Primary Revenue Stream</Label>
            <Input
              placeholder="e.g., SaaS Subscription"
              value={data.primaryRevenue}
              onChange={(e) => updateData("primaryRevenue", e.target.value)}
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            {data.pricingTiers.map((tier, i) => (
              <div
                key={i}
                className="p-4 border-2 border-dashed rounded-lg space-y-2"
              >
                <Input
                  placeholder="Tier Name"
                  value={tier.name}
                  onChange={(e) => {
                    const newTiers = [...data.pricingTiers];
                    newTiers[i] = {
                      ...tier,
                      name: e.target.value,
                    };
                    updateData("pricingTiers", newTiers);
                  }}
                />
                <Input
                  placeholder="Price"
                  value={tier.price}
                  onChange={(e) => {
                    const newTiers = [...data.pricingTiers];
                    newTiers[i] = {
                      ...tier,
                      price: e.target.value,
                    };
                    updateData("pricingTiers", newTiers);
                  }}
                />
                <Textarea
                  placeholder="Features..."
                  value={tier.features}
                  onChange={(e) => {
                    const newTiers = [...data.pricingTiers];
                    newTiers[i] = {
                      ...tier,
                      features: e.target.value,
                    };
                    updateData("pricingTiers", newTiers);
                  }}
                />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-4 mt-4">
            <div>
              <Label>CAC (Customer Acquisition Cost)</Label>
              <Input
                placeholder="e.g., $120"
                value={data.cac}
                onChange={(e) => updateData("cac", e.target.value)}
              />
            </div>
            <div>
              <Label>LTV (Lifetime Value)</Label>
              <Input
                placeholder="e.g., $850"
                value={data.ltv}
                onChange={(e) => updateData("ltv", e.target.value)}
              />
            </div>
            <div>
              <Label>Gross Margin</Label>
              <Input
                placeholder="e.g., 85%"
                value={data.margin}
                onChange={(e) => updateData("margin", e.target.value)}
              />
            </div>
          </div>
        </div>
      ) : (
        <>
          <p className="text-xl mb-6">
            {"Primary Revenue: "}
            <span className="font-semibold">{data.primaryRevenue}</span>
          </p>
          <div className="grid grid-cols-3 gap-6 mb-8">
            {data.pricingTiers.map((tier, i) => (
              <div
                key={i}
                className="p-6 border-2 border-border rounded-lg text-center"
              >
                <h3 className="text-xl font-semibold mb-2">{tier.name}</h3>
                <p className="text-3xl font-bold text-primary mb-4">
                  {tier.price}
                </p>
                <p className="text-sm text-muted-foreground">{tier.features}</p>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-6 p-6 bg-primary/5 rounded-lg">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-1">CAC</p>
              <p className="text-2xl font-bold">{data.cac || "$120"}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-1">LTV</p>
              <p className="text-2xl font-bold">{data.ltv || "$850"}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-1">Gross Margin</p>
              <p className="text-2xl font-bold">{data.margin || "85%"}</p>
            </div>
          </div>
        </>
      )}
    </div>
  );

  // Slide 8: Traction
  const renderTractionSlide = () => (
    <div className="h-full p-12 space-y-6">
      <div className="mb-8">
        <Badge className="mb-4">Slide 8</Badge>
        <h2 className="text-4xl font-bold mb-4">Traction & Growth</h2>
      </div>
      {editMode ? (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>User Growth</Label>
              <Input
                placeholder="e.g., 12.5K → 35K users"
                value={data.userGrowth}
                onChange={(e) => updateData("userGrowth", e.target.value)}
              />
            </div>
            <div>
              <Label>Revenue Growth</Label>
              <Input
                placeholder="e.g., $42K → $197K MRR"
                value={data.revenue}
                onChange={(e) => updateData("revenue", e.target.value)}
              />
            </div>
            <div>
              <Label>Retention Rate</Label>
              <Input
                placeholder="e.g., 87%"
                value={data.retention}
                onChange={(e) => updateData("retention", e.target.value)}
              />
            </div>
          </div>
          <div>
            <Label>Major Milestones (4)</Label>
            {data.milestones.map((milestone, i) => (
              <Input
                key={i}
                placeholder={`Milestone ${i + 1}`}
                value={milestone}
                onChange={(e) => {
                  const newMilestones = [...data.milestones];
                  newMilestones[i] = e.target.value;
                  updateData("milestones", newMilestones);
                }}
                className="mb-2"
              />
            ))}
          </div>
          <div>
            <Label>Customer Testimonial</Label>
            <Input
              placeholder={'"Quote from satisfied customer"'}
              value={data.testimonial}
              onChange={(e) => updateData("testimonial", e.target.value)}
            />
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-6 mb-8">
            <div className="text-center p-6 bg-primary/5 rounded-lg">
              <Users className="w-12 h-12 text-primary mx-auto mb-3" />
              <p className="text-sm text-muted-foreground mb-2">User Growth</p>
              <p className="text-2xl font-bold">{data.userGrowth}</p>
            </div>
            <div className="text-center p-6 bg-primary/5 rounded-lg">
              <DollarSign className="w-12 h-12 text-primary mx-auto mb-3" />
              <p className="text-sm text-muted-foreground mb-2">Revenue</p>
              <p className="text-2xl font-bold">{data.revenue}</p>
            </div>
            <div className="text-center p-6 bg-primary/5 rounded-lg">
              <Target className="w-12 h-12 text-primary mx-auto mb-3" />
              <p className="text-sm text-muted-foreground mb-2">Retention</p>
              <p className="text-2xl font-bold">{data.retention}</p>
            </div>
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-4">Major Milestones</h3>
            <div className="grid grid-cols-2 gap-4 mb-6">
              {data.milestones
                .filter((m) => m)
                .map((milestone, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-primary flex-shrink-0" />
                    <p>{milestone}</p>
                  </div>
                ))}
            </div>
          </div>
          {data.testimonial && (
            <div className="bg-primary/5 p-6 rounded-lg border-l-4 border-primary">
              <p className="text-lg italic">"{data.testimonial}"</p>
            </div>
          )}
        </>
      )}
    </div>
  );

  // Slide 9: Competition
  const renderCompetitionSlide = () => (
    <div className="h-full p-12 space-y-6">
      <div className="mb-8">
        <Badge className="mb-4">Slide 9</Badge>
        <h2 className="text-4xl font-bold mb-4">Competitive Landscape</h2>
      </div>
      {editMode ? (
        <div className="space-y-4">
          <div>
            <Label>Key Competitors (3-5)</Label>
            {data.competitors.map((comp, i) => (
              <div
                key={i}
                className="p-4 border-2 border-dashed rounded-lg space-y-2 mb-3"
              >
                <Input
                  placeholder="Competitor Name"
                  value={comp.name}
                  onChange={(e) => {
                    const newComps = [...data.competitors];
                    newComps[i] = {
                      ...comp,
                      name: e.target.value,
                    };
                    updateData("competitors", newComps);
                  }}
                />
                <Textarea
                  placeholder="What they do and why you're different..."
                  value={comp.description}
                  onChange={(e) => {
                    const newComps = [...data.competitors];
                    newComps[i] = {
                      ...comp,
                      description: e.target.value,
                    };
                    updateData("competitors", newComps);
                  }}
                />
              </div>
            ))}
          </div>
          <div>
            <Label>Your Unique Advantages (4)</Label>
            {data.uniqueAdvantages.map((adv, i) => (
              <Input
                key={i}
                placeholder={`Advantage ${i + 1}`}
                value={adv}
                onChange={(e) => {
                  const newAdvs = [...data.uniqueAdvantages];
                  newAdvs[i] = e.target.value;
                  updateData("uniqueAdvantages", newAdvs);
                }}
                className="mb-2"
              />
            ))}
          </div>
        </div>
      ) : (
        <>
          <div className="space-y-4 mb-8">
            <h3 className="text-xl font-semibold">Competitive Landscape</h3>
            {data.competitors
              .filter((c) => c.name)
              .map((comp, i) => (
                <div key={i} className="p-4 bg-muted/50 rounded-lg">
                  <p className="font-semibold mb-2">{comp.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {comp.description}
                  </p>
                </div>
              ))}
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-4">Our Unique Position</h3>
            <div className="grid grid-cols-2 gap-4">
              {data.uniqueAdvantages
                .filter((a) => a)
                .map((adv, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 p-4 bg-primary/5 rounded-lg"
                  >
                    <Zap className="w-5 h-5 text-primary flex-shrink-0" />
                    <p>{adv}</p>
                  </div>
                ))}
            </div>
          </div>
        </>
      )}
    </div>
  );

  // Slide 10: Go-to-Market
  const renderGoToMarketSlide = () => (
    <div className="h-full p-12 space-y-6">
      <div className="mb-8">
        <Badge className="mb-4">Slide 10</Badge>
        <h2 className="text-4xl font-bold mb-4">Go-to-Market Strategy</h2>
      </div>
      {editMode ? (
        <div className="space-y-4">
          <div>
            <Label>Target Segments (3)</Label>
            {data.targetSegments.map((seg, i) => (
              <Input
                key={i}
                placeholder={`Segment ${i + 1} (e.g., "First-time Founders")`}
                value={seg}
                onChange={(e) => {
                  const newSegs = [...data.targetSegments];
                  newSegs[i] = e.target.value;
                  updateData("targetSegments", newSegs);
                }}
                className="mb-2"
              />
            ))}
          </div>
          <div>
            <Label>Acquisition Channels</Label>
            {data.acquisitionChannels.map((channel, i) => (
              <div key={i} className="grid grid-cols-2 gap-4 mb-2">
                <Input
                  placeholder="Channel Name"
                  value={channel.channel}
                  onChange={(e) => {
                    const newChannels = [...data.acquisitionChannels];
                    newChannels[i] = {
                      ...channel,
                      channel: e.target.value,
                    };
                    updateData("acquisitionChannels", newChannels);
                  }}
                />
                <Input
                  placeholder="% of users"
                  value={channel.percentage}
                  onChange={(e) => {
                    const newChannels = [...data.acquisitionChannels];
                    newChannels[i] = {
                      ...channel,
                      percentage: e.target.value,
                    };
                    updateData("acquisitionChannels", newChannels);
                  }}
                />
              </div>
            ))}
          </div>
          <div>
            <Label>Free-to-Paid Conversion Rate</Label>
            <Input
              placeholder="e.g., 18%"
              value={data.conversionRate}
              onChange={(e) => updateData("conversionRate", e.target.value)}
            />
          </div>
        </div>
      ) : (
        <>
          <div className="mb-8">
            <h3 className="text-xl font-semibold mb-4">Target Segments</h3>
            <div className="grid grid-cols-3 gap-4">
              {data.targetSegments
                .filter((s) => s)
                .map((seg, i) => (
                  <div
                    key={i}
                    className="p-4 bg-primary/5 rounded-lg text-center"
                  >
                    <p className="font-semibold">{seg}</p>
                  </div>
                ))}
            </div>
          </div>
          <div className="mb-8">
            <h3 className="text-xl font-semibold mb-4">Acquisition Channels</h3>
            <div className="space-y-3">
              {data.acquisitionChannels
                .filter((c) => c.channel)
                .map((channel, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-semibold">{channel.channel}</p>
                        <p className="text-primary font-bold">
                          {channel.percentage}%
                        </p>
                      </div>
                      <div className="h-3 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full"
                          style={{
                            width: `${channel.percentage}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
          <div className="p-6 bg-primary/5 rounded-lg text-center">
            <p className="text-sm text-muted-foreground mb-2">
              Free-to-Paid Conversion Rate
            </p>
            <p className="text-4xl font-bold text-primary">
              {data.conversionRate || "18%"}
            </p>
          </div>
        </>
      )}
    </div>
  );

  // Slide 11: Financials
  const renderFinancialsSlide = () => (
    <div className="h-full p-12 space-y-6">
      <div className="mb-8">
        <Badge className="mb-4">Slide 11</Badge>
        <h2 className="text-4xl font-bold mb-4">Financial Projections</h2>
        <p className="text-xl text-muted-foreground">5-Year Forecast</p>
      </div>
      {editMode ? (
        <div className="space-y-4">
          <div className="grid grid-cols-5 gap-4">
            <div>
              <Label>Year 1 Revenue</Label>
              <Input
                placeholder="$850K"
                value={data.year1Revenue}
                onChange={(e) => updateData("year1Revenue", e.target.value)}
              />
            </div>
            <div>
              <Label>Year 2 Revenue</Label>
              <Input
                placeholder="$2.8M"
                value={data.year2Revenue}
                onChange={(e) => updateData("year2Revenue", e.target.value)}
              />
            </div>
            <div>
              <Label>Year 3 Revenue</Label>
              <Input
                placeholder="$10M"
                value={data.year3Revenue}
                onChange={(e) => updateData("year3Revenue", e.target.value)}
              />
            </div>
            <div>
              <Label>Year 4 Revenue</Label>
              <Input
                placeholder="$28M"
                value={data.year4Revenue}
                onChange={(e) => updateData("year4Revenue", e.target.value)}
              />
            </div>
            <div>
              <Label>Year 5 Revenue</Label>
              <Input
                placeholder="$65M"
                value={data.year5Revenue}
                onChange={(e) => updateData("year5Revenue", e.target.value)}
              />
            </div>
          </div>
          <div>
            <Label>Key Assumptions (4)</Label>
            {data.keyAssumptions.map((assumption, i) => (
              <Input
                key={i}
                placeholder={`Assumption ${i + 1}`}
                value={assumption}
                onChange={(e) => {
                  const newAssumptions = [...data.keyAssumptions];
                  newAssumptions[i] = e.target.value;
                  updateData("keyAssumptions", newAssumptions);
                }}
                className="mb-2"
              />
            ))}
          </div>
        </div>
      ) : (
        <>
          <div className="mb-8">
            <div className="grid grid-cols-5 gap-4">
              {[
                {
                  year: "Year 1",
                  value: data.year1Revenue || "$850K",
                },
                {
                  year: "Year 2",
                  value: data.year2Revenue || "$2.8M",
                },
                {
                  year: "Year 3",
                  value: data.year3Revenue || "$10M",
                },
                {
                  year: "Year 4",
                  value: data.year4Revenue || "$28M",
                },
                {
                  year: "Year 5",
                  value: data.year5Revenue || "$65M",
                },
              ].map((item, i) => (
                <div key={i} className="text-center">
                  <p className="text-sm text-muted-foreground mb-2">
                    {item.year}
                  </p>
                  <div
                    className="bg-primary rounded-t-lg flex items-end justify-center pb-4"
                    style={{
                      height: `${100 + i * 40}px`,
                    }}
                  >
                    <p className="text-white font-bold text-lg">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-4">Key Assumptions</h3>
            <div className="grid grid-cols-2 gap-4">
              {data.keyAssumptions
                .filter((a) => a)
                .map((assumption, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                    <p className="text-muted-foreground">{assumption}</p>
                  </div>
                ))}
            </div>
          </div>
        </>
      )}
    </div>
  );

  // Slide 12: Team
  const renderTeamSlide = () => (
    <div className="h-full p-12 space-y-6">
      <div className="mb-8">
        <Badge className="mb-4">Slide 12</Badge>
        <h2 className="text-4xl font-bold mb-4">The Team</h2>
        <p className="text-xl text-muted-foreground">Built to Win</p>
      </div>
      {editMode ? (
        <div className="space-y-4">
          <div>
            <Label>Founders & Key Team Members</Label>
            {data.teamMembers.map((member, i) => (
              <div
                key={i}
                className="p-4 border-2 border-dashed rounded-lg space-y-2 mb-3"
              >
                <Input
                  placeholder="Full Name"
                  value={member.name}
                  onChange={(e) => {
                    const newMembers = [...data.teamMembers];
                    newMembers[i] = {
                      ...member,
                      name: e.target.value,
                    };
                    updateData("teamMembers", newMembers);
                  }}
                />
                <Input
                  placeholder="Title & Role"
                  value={member.title}
                  onChange={(e) => {
                    const newMembers = [...data.teamMembers];
                    newMembers[i] = {
                      ...member,
                      title: e.target.value,
                    };
                    updateData("teamMembers", newMembers);
                  }}
                />
                <Textarea
                  placeholder="Background & expertise (e.g., 'Ex-Product Lead at Stripe, built Atlas')"
                  value={member.background}
                  onChange={(e) => {
                    const newMembers = [...data.teamMembers];
                    newMembers[i] = {
                      ...member,
                      background: e.target.value,
                    };
                    updateData("teamMembers", newMembers);
                  }}
                />
              </div>
            ))}
          </div>
          <div>
            <Label>Advisors (3)</Label>
            {data.advisors.map((advisor, i) => (
              <Input
                key={i}
                placeholder={`Advisor ${i + 1} (Name & credentials)`}
                value={advisor}
                onChange={(e) => {
                  const newAdvisors = [...data.advisors];
                  newAdvisors[i] = e.target.value;
                  updateData("advisors", newAdvisors);
                }}
                className="mb-2"
              />
            ))}
          </div>
        </div>
      ) : (
        <>
          <div className="space-y-6 mb-8">
            {data.teamMembers
              .filter((m) => m.name)
              .map((member, i) => (
                <div key={i} className="flex gap-4 p-4 bg-muted/30 rounded-lg">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Users className="w-8 h-8 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold">{member.name}</h3>
                    <p className="text-primary font-medium mb-2">
                      {member.title}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {member.background}
                    </p>
                  </div>
                </div>
              ))}
          </div>
          {data.advisors.filter((a) => a).length > 0 && (
            <div>
              <h3 className="text-xl font-semibold mb-4">Advisors</h3>
              <div className="grid grid-cols-3 gap-4">
                {data.advisors
                  .filter((a) => a)
                  .map((advisor, i) => (
                    <div
                      key={i}
                      className="p-4 bg-primary/5 rounded-lg text-center"
                    >
                      <Award className="w-8 h-8 text-primary mx-auto mb-2" />
                      <p className="text-sm font-medium">{advisor}</p>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );

  // Slide 13: The Ask
  const renderTheAskSlide = () => (
    <div className="h-full p-12 space-y-6">
      <div className="mb-8">
        <Badge className="mb-4">Slide 13</Badge>
        <h2 className="text-4xl font-bold mb-4">The Ask</h2>
      </div>
      {editMode ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Raising Amount</Label>
              <Input
                placeholder="e.g., $2,000,000"
                value={data.raisingAmount}
                onChange={(e) => updateData("raisingAmount", e.target.value)}
              />
            </div>
            <div>
              <Label>Pre-money Valuation</Label>
              <Input
                placeholder="e.g., $8M"
                value={data.valuation}
                onChange={(e) => updateData("valuation", e.target.value)}
              />
            </div>
          </div>
          <div>
            <Label>Use of Funds</Label>
            {data.useOfFunds.map((item, i) => (
              <div key={i} className="grid grid-cols-3 gap-4 mb-2">
                <Input
                  placeholder="Category"
                  value={item.category}
                  onChange={(e) => {
                    const newFunds = [...data.useOfFunds];
                    newFunds[i] = {
                      ...item,
                      category: e.target.value,
                    };
                    updateData("useOfFunds", newFunds);
                  }}
                />
                <Input
                  placeholder="%"
                  value={item.percentage}
                  onChange={(e) => {
                    const newFunds = [...data.useOfFunds];
                    newFunds[i] = {
                      ...item,
                      percentage: e.target.value,
                    };
                    updateData("useOfFunds", newFunds);
                  }}
                />
                <Input
                  placeholder="Description"
                  value={item.description}
                  onChange={(e) => {
                    const newFunds = [...data.useOfFunds];
                    newFunds[i] = {
                      ...item,
                      description: e.target.value,
                    };
                    updateData("useOfFunds", newFunds);
                  }}
                />
              </div>
            ))}
          </div>
          <div>
            <Label>Key Milestones (Next 18 months)</Label>
            {data.milestones.map((milestone, i) => (
              <Input
                key={i}
                placeholder={`Milestone ${i + 1}`}
                value={milestone}
                onChange={(e) => {
                  const newMilestones = [...data.milestones];
                  newMilestones[i] = e.target.value;
                  updateData("milestones", newMilestones);
                }}
                className="mb-2"
              />
            ))}
          </div>
          <div>
            <Label>Runway</Label>
            <Input
              placeholder="e.g., 18 months to Series A"
              value={data.runway}
              onChange={(e) => updateData("runway", e.target.value)}
            />
          </div>
        </div>
      ) : (
        <>
          <div className="text-center mb-8">
            <p className="text-lg text-muted-foreground mb-4">Raising</p>
            <p className="text-6xl font-bold text-primary mb-4">
              {data.raisingAmount || "$2,000,000"}
            </p>
            <p className="text-xl">
              {"Pre-money Valuation: "}
              <span className="font-semibold">{data.valuation || "$8M"}</span>
            </p>
          </div>
          <div className="mb-8">
            <h3 className="text-xl font-semibold mb-4">Use of Funds</h3>
            <div className="space-y-3">
              {data.useOfFunds.map((item, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-semibold">
                        {item.category}
                        {" ("}
                        {item.percentage}%)
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {item.description}
                      </p>
                    </div>
                    <div className="h-3 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full"
                        style={{
                          width: `${item.percentage}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-4">What We'll Achieve</h3>
            <div className="grid grid-cols-2 gap-4 mb-6">
              {data.milestones
                .filter((m) => m)
                .map((milestone, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-primary flex-shrink-0" />
                    <p>{milestone}</p>
                  </div>
                ))}
            </div>
          </div>
          <div className="text-center p-6 bg-primary/5 rounded-lg">
            <p className="text-lg font-semibold">
              {data.runway || "18 months to Series A"}
            </p>
          </div>
        </>
      )}
    </div>
  );
  const slides = [
    renderCoverSlide,
    renderProblemSlide,
    renderSolutionSlide,
    renderWhyNowSlide,
    renderMarketSizeSlide,
    renderProductSlide,
    renderBusinessModelSlide,
    renderTractionSlide,
    renderCompetitionSlide,
    renderGoToMarketSlide,
    renderFinancialsSlide,
    renderTeamSlide,
    renderTheAskSlide,
  ];
  const slideNames = [
    "Cover",
    "Problem",
    "Solution",
    "Why Now",
    "Market Size",
    "Product",
    "Business Model",
    "Traction",
    "Competition",
    "Go-to-Market",
    "Financials",
    "Team",
    "The Ask",
  ];
  return (
    <div className="min-h-screen bg-background">
      {!presentationMode && (
        <div className="border-b bg-background/95 backdrop-blur sticky top-0 z-10">
          <div className="px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={onBack}>
                <ChevronLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-xl font-bold">Pitch Deck Builder</h1>
                <p className="text-sm text-muted-foreground">
                  {"Slide "}
                  {currentSlide + 1}
                  {" of 13 - "}
                  {slideNames[currentSlide]}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={editMode ? "default" : "outline"}
                size="sm"
                onClick={() => setEditMode(!editMode)}
              >
                {editMode ? (
                  <Eye className="w-4 h-4 mr-2" />
                ) : (
                  <Edit3 className="w-4 h-4 mr-2" />
                )}
                {editMode ? "Preview" : "Edit"}
              </Button>
              <Button variant="outline" size="sm" onClick={saveData}>
                <Save className="w-4 h-4 mr-2" />
                Save
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPresentationMode(true)}
              >
                <Presentation className="w-4 h-4 mr-2" />
                Present
              </Button>
              <Button variant="outline" size="sm" onClick={exportToPDF}>
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
          <div className="px-6 pb-4 flex items-center gap-2 overflow-x-auto">
            {slideNames.map((name, i) => (
              <Button
                key={i}
                variant={currentSlide === i ? "default" : "ghost"}
                size="sm"
                onClick={() => setCurrentSlide(i)}
                className="flex-shrink-0"
              >
                {i + 1}
                {". "}
                {name}
              </Button>
            ))}
          </div>
        </div>
      )}
      <div className={presentationMode ? "h-screen" : "p-8"}>
        <Card
          className={
            presentationMode
              ? "h-full rounded-none border-0"
              : "max-w-6xl mx-auto aspect-[16/9] shadow-2xl"
          }
        >
          <CardContent className="p-0 h-full relative">
            {slides[currentSlide]()}
          </CardContent>
        </Card>
      </div>
      <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur border-t p-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Button
            variant="outline"
            onClick={prevSlide}
            disabled={currentSlide === 0}
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>
          <div className="flex items-center gap-2">
            {presentationMode && (
              <Button
                variant="outline"
                onClick={() => setPresentationMode(false)}
              >
                <X className="w-4 h-4 mr-2" />
                Exit Presentation
              </Button>
            )}
            <span className="text-sm text-muted-foreground">
              {currentSlide + 1}
              {" / "}
              {slides.length}
            </span>
          </div>
          <Button
            onClick={nextSlide}
            disabled={currentSlide === slides.length - 1}
          >
            Next
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}
