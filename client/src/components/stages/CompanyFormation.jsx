import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Label } from "../ui/label";
import { Badge } from "../ui/badge";
import {
  FileText,
  ArrowLeft,
  ArrowRight,
  Building2,
  Globe,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  Shield,
  Sparkles,
  FastForward,
} from "lucide-react";
import { toast } from "sonner";
import {
  useHydrateStageDraft,
  persistStageDraft,
} from "../../hooks/useStageDraftFromJourney";
const cacPackages = [
  {
    id: "business-name",
    name: "Business Name Registration",
    price: "₦25,000",
    timeline: "3-5 business days",
    features: [
      "Business name search & reservation",
      "CAC registration certificate",
      "Business name certificate",
      "TIN registration",
      "Suitable for sole proprietors & partnerships",
    ],
  },
  {
    id: "limited-company",
    name: "Limited Liability Company (LLC)",
    price: "₦95,000",
    timeline: "7-10 business days",
    features: [
      "Company name search & reservation",
      "Memorandum & Articles of Association",
      "CAC registration certificate",
      "Company incorporation certificate",
      "TIN & Corporate bank account support",
      "Limited liability protection",
      "Better for scaling & investment",
    ],
    popular: true,
  },
  {
    id: "limited-liability",
    name: "Limited by Guarantee (NGO)",
    price: "₦120,000",
    timeline: "10-14 business days",
    features: [
      "Company name search & reservation",
      "Memorandum & Articles of Association",
      "CAC registration certificate",
      "Suitable for NGOs & non-profits",
      "TIN registration",
      "Tax exemption support",
    ],
  },
];
const delawarePackage = {
  id: "delaware-llc",
  name: "Delaware LLC Registration",
  price: "$499",
  timeline: "5-7 business days",
  features: [
    "Delaware LLC formation",
    "Registered agent service (1 year)",
    "EIN application",
    "Operating agreement",
    "Certificate of formation",
    "Banking support for US account",
    "International startup-friendly",
  ],
};
export default function CompanyFormation({ user, onBack }) {
  const [companyData, setCompanyData] = useState({
    incorporated: "",
    registrationType: "",
    cacPackage: "",
    companyName: "",
    registrationNumber: "",
    dateOfIncorporation: "",
    registeredAddress: "",
    proposedName1: "",
    proposedName2: "",
    proposedName3: "",
    businessNature: "",
    businessAddress: "",
    director1Name: "",
    director1Email: "",
    director1Phone: "",
    director1Address: "",
    director1BVN: "",
    director2Name: "",
    director2Email: "",
    director2Phone: "",
    delawareCompanyName: "",
    delawareRegisteredAgent: "",
    secretaryName: "",
    secretaryEmail: "",
    secretaryPhone: "",
  });
  const [currentStep, setCurrentStep] = useState("choice");

  useHydrateStageDraft(user, "company_formation", (raw) => {
    if (!raw || typeof raw !== "object") return;
    setCompanyData((prev) => ({ ...prev, ...raw }));
  });

  // Auto-navigate based on saved choices
  useEffect(() => {
    if (companyData.incorporated === "yes") {
      setCurrentStep("existing");
    } else if (companyData.incorporated === "no") {
      if (companyData.registrationType === "cac" && companyData.cacPackage) {
        setCurrentStep("cac-form");
      } else if (companyData.registrationType === "delaware") {
        setCurrentStep("delaware-form");
      } else {
        setCurrentStep("new-select");
      }
    }
  }, []);

  // Save and continue
  const saveAndContinue = () => {
    persistStageDraft("company_formation", companyData);
    toast.success("Progress saved! Moving to next stage...");
    setTimeout(() => onBack(), 500);
  };
  const handleSkipPhase = () => {
    // Save skip state
    const skipData = {
      ...companyData,
      skipped: true,
      skipReason: "Already completed independently",
    };
    persistStageDraft("company_formation", skipData);
    toast.success("Phase skipped - You can come back anytime to add details");
    setTimeout(() => onBack(), 500);
  };
  const handleIncorporationChoice = (choice) => {
    setCompanyData({
      ...companyData,
      incorporated: choice,
    });
    setCurrentStep(choice === "yes" ? "existing" : "new-select");
  };
  const handleRegistrationType = (type) => {
    setCompanyData({
      ...companyData,
      registrationType: type,
    });
    if (type === "delaware") {
      setCurrentStep("delaware-form");
    } else {
      // Stay on selection for CAC to choose package
    }
  };
  const handleCACPackageSelect = (packageId) => {
    setCompanyData({
      ...companyData,
      cacPackage: packageId,
    });
    setCurrentStep("cac-form");
  };
  const handlePayment = (packageType, price) => {
    // Mock payment - in production, this would integrate with payment gateway
    toast.success(`Payment initiated for ${packageType} - ${price}`, {
      description: "You will be redirected to payment gateway...",
    });

    // Save data before payment
    persistStageDraft("company_formation", companyData);
  };
  const selectedCACPackage = cacPackages.find(
    (p) => p.id === companyData.cacPackage,
  );
  return (
    <div className="h-full overflow-auto bg-gradient-to-br from-background via-background to-primary/5">
      <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        <div className="space-y-4">
          <Button
            variant="ghost"
            onClick={onBack}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Journey
          </Button>
          <div>
            <h1 className="mb-2 flex items-center gap-2">
              <FileText className="w-8 h-8 text-foreground" />
              Stage 2: Company Formation
            </h1>
            <p className="text-muted-foreground">
              Set up your legal entity and foundational documents
            </p>
          </div>
          <Card className="border-orange-200 dark:border-orange-800 bg-orange-50/50 dark:bg-orange-950/20">
            <CardContent className="py-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <FastForward className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                  <div>
                    <p className="font-semibold text-sm">Already Completed?</p>
                    <p className="text-xs text-muted-foreground">
                      Skip this phase if you've already registered your company
                      elsewhere
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSkipPhase}
                  className="flex-shrink-0"
                >
                  <FastForward className="w-4 h-4 mr-1" />
                  Skip Phase
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
        <Card className="border-2 border-primary/50 bg-gradient-to-br from-primary/10 via-primary/5 to-accent/10 shadow-lg">
          <CardContent className="py-6">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-primary/20 flex-shrink-0">
                <Sparkles className="w-8 h-8 text-primary" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-bold text-lg">
                    CAC Registration Service
                  </h3>
                  <Badge
                    variant="secondary"
                    className="bg-accent text-accent-foreground"
                  >
                    Coming Soon
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  We're launching a full-service CAC registration platform! Soon
                  you'll be able to register your Business Name or Limited
                  Company directly through StartupVerse with our verified legal
                  partners.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold">
                        Business Name from ₦25,000
                      </p>
                      <p className="text-xs text-muted-foreground">
                        3-5 business days
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold">
                        Limited Company from ₦95,000
                      </p>
                      <p className="text-xs text-muted-foreground">
                        7-10 business days
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold">
                        Full Document Support
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Certificate + TIN
                      </p>
                    </div>
                  </div>
                </div>
                <div className="mt-4 p-3 bg-background/50 rounded-lg border">
                  <p className="text-xs text-muted-foreground">
                    {"💡 "}
                    <strong>What's Coming:</strong>
                    {
                      " Simple application form → Partner agency handles everything → Track status in real-time → Get registered documents delivered to your dashboard"
                    }
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-primary/50 bg-primary/5">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Shield className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-semibold">
                  Official StartupVerse Legal Partner
                </p>
                <p className="text-sm text-muted-foreground">
                  We've partnered with verified legal firms to help you
                  incorporate quickly and affordably
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        {currentStep === "choice" && (
          <Card>
            <CardHeader>
              <CardTitle>Have you already incorporated your company?</CardTitle>
              <p className="text-sm text-muted-foreground">
                Let us know your current legal status
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => handleIncorporationChoice("yes")}
                  className="p-6 border-2 rounded-lg hover:border-primary hover:shadow-md transition-all text-left"
                >
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                    <div>
                      <p className="font-semibold mb-1">
                        Yes, Already Incorporated
                      </p>
                      <p className="text-sm text-muted-foreground">
                        I already have a registered company and just need to
                        provide details
                      </p>
                    </div>
                  </div>
                </button>
                <button
                  onClick={() => handleIncorporationChoice("no")}
                  className="p-6 border-2 rounded-lg hover:border-primary hover:shadow-md transition-all text-left"
                >
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-6 h-6 text-orange-600 flex-shrink-0 mt-1" />
                    <div>
                      <p className="font-semibold mb-1">
                        No, Need to Incorporate
                      </p>
                      <p className="text-sm text-muted-foreground">
                        I need help registering my company (CAC or Delaware)
                      </p>
                    </div>
                  </div>
                </button>
              </div>
            </CardContent>
          </Card>
        )}
        {currentStep === "existing" && (
          <Card>
            <CardHeader>
              <CardTitle>Your Company Details</CardTitle>
              <p className="text-sm text-muted-foreground">
                Provide information about your registered company
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="companyName">Registered Company Name</Label>
                <Input
                  id="companyName"
                  placeholder="e.g., StartupVerse Technologies Limited"
                  value={companyData.companyName}
                  onChange={(e) =>
                    setCompanyData({
                      ...companyData,
                      companyName: e.target.value,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="registrationNumber">
                  Registration Number (CAC/RC Number)
                </Label>
                <Input
                  id="registrationNumber"
                  placeholder="e.g., RC 1234567"
                  value={companyData.registrationNumber}
                  onChange={(e) =>
                    setCompanyData({
                      ...companyData,
                      registrationNumber: e.target.value,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dateOfIncorporation">
                  Date of Incorporation
                </Label>
                <Input
                  id="dateOfIncorporation"
                  type="date"
                  value={companyData.dateOfIncorporation}
                  onChange={(e) =>
                    setCompanyData({
                      ...companyData,
                      dateOfIncorporation: e.target.value,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="registeredAddress">Registered Address</Label>
                <Textarea
                  id="registeredAddress"
                  placeholder="Full registered business address"
                  value={companyData.registeredAddress}
                  onChange={(e) =>
                    setCompanyData({
                      ...companyData,
                      registeredAddress: e.target.value,
                    })
                  }
                  rows={3}
                />
              </div>
              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep("choice")}
                  className="flex-1"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <Button
                  onClick={saveAndContinue}
                  className="flex-1 gap-2"
                  size="lg"
                >
                  Save & Continue to Next Stage
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
        {currentStep === "new-select" && (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Choose Your Registration Location</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Select where you want to incorporate your company
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    onClick={() => handleRegistrationType("cac")}
                    className={`p-6 border-2 rounded-lg hover:border-primary hover:shadow-md transition-all text-left ${companyData.registrationType === "cac" ? "border-primary bg-primary/5" : ""}`}
                  >
                    <div className="flex items-start gap-3">
                      <Building2 className="w-8 h-8 text-primary flex-shrink-0" />
                      <div className="flex-1">
                        <p className="font-semibold mb-1">
                          CAC Registration (Nigeria)
                        </p>
                        <p className="text-sm text-muted-foreground mb-3">
                          Register with Corporate Affairs Commission for
                          Nigerian operations
                        </p>
                        <Badge variant="secondary">
                          Most Popular for Nigerian Startups
                        </Badge>
                      </div>
                    </div>
                  </button>
                  <button
                    onClick={() => handleRegistrationType("delaware")}
                    className={`p-6 border-2 rounded-lg hover:border-primary hover:shadow-md transition-all text-left ${companyData.registrationType === "delaware" ? "border-primary bg-primary/5" : ""}`}
                  >
                    <div className="flex items-start gap-3">
                      <Globe className="w-8 h-8 text-primary flex-shrink-0" />
                      <div className="flex-1">
                        <p className="font-semibold mb-1">Delaware LLC (USA)</p>
                        <p className="text-sm text-muted-foreground mb-3">
                          Register in Delaware for international fundraising and
                          global expansion
                        </p>
                        <Badge variant="secondary">
                          Best for International VCs
                        </Badge>
                      </div>
                    </div>
                  </button>
                </div>
              </CardContent>
            </Card>
            {companyData.registrationType === "cac" && (
              <Card>
                <CardHeader>
                  <CardTitle>Choose Your CAC Registration Package</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Select the package that fits your business needs
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {cacPackages.map((pkg) => (
                    <div
                      key={pkg.id}
                      className={`p-6 border-2 rounded-lg hover:shadow-md transition-all ${companyData.cacPackage === pkg.id ? "border-primary bg-primary/5" : ""} ${pkg.popular ? "relative" : ""}`}
                    >
                      {pkg.popular && (
                        <Badge
                          className="absolute top-4 right-4"
                          variant="default"
                        >
                          Most Popular
                        </Badge>
                      )}
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="font-semibold mb-1">{pkg.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {pkg.timeline}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-primary">
                            {pkg.price}
                          </p>
                        </div>
                      </div>
                      <ul className="space-y-2 mb-4">
                        {pkg.features.map((feature, idx) => (
                          <li
                            key={idx}
                            className="flex items-start gap-2 text-sm"
                          >
                            <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                      <Button
                        onClick={() => handleCACPackageSelect(pkg.id)}
                        className="w-full"
                        variant={
                          companyData.cacPackage === pkg.id
                            ? "default"
                            : "outline"
                        }
                      >
                        {companyData.cacPackage === pkg.id
                          ? "Selected - Proceed to Form"
                          : "Select Package"}
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
            {companyData.registrationType === "delaware" && (
              <Card className="border-primary">
                <CardHeader>
                  <CardTitle>Delaware LLC Registration Package</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Everything you need to incorporate in Delaware
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-semibold mb-1">
                        {delawarePackage.name}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {delawarePackage.timeline}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-primary">
                        {delawarePackage.price}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        One-time fee
                      </p>
                    </div>
                  </div>
                  <ul className="space-y-2 mb-6">
                    {delawarePackage.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    onClick={() => setCurrentStep("delaware-form")}
                    className="w-full"
                    size="lg"
                  >
                    Proceed to Application Form
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            )}
            <div className="flex justify-start">
              <Button
                variant="outline"
                onClick={() => {
                  setCompanyData({
                    ...companyData,
                    registrationType: "",
                    cacPackage: "",
                  });
                  setCurrentStep("choice");
                }}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Choice
              </Button>
            </div>
          </>
        )}
        {currentStep === "cac-form" && selectedCACPackage && (
          <>
            <Card className="border-primary/50 bg-primary/5">
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{selectedCACPackage.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Complete the form below to proceed
                    </p>
                  </div>
                  <Badge className="text-lg px-4 py-1">
                    {selectedCACPackage.price}
                  </Badge>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Proposed Company Names</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Provide 3 name options (in order of preference) for name
                  search
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="proposedName1">
                    1st Choice Company Name *
                  </Label>
                  <Input
                    id="proposedName1"
                    placeholder="e.g., StartupVerse Technologies Limited"
                    value={companyData.proposedName1}
                    onChange={(e) =>
                      setCompanyData({
                        ...companyData,
                        proposedName1: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="proposedName2">
                    2nd Choice Company Name *
                  </Label>
                  <Input
                    id="proposedName2"
                    placeholder="Alternative name option"
                    value={companyData.proposedName2}
                    onChange={(e) =>
                      setCompanyData({
                        ...companyData,
                        proposedName2: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="proposedName3">
                    3rd Choice Company Name *
                  </Label>
                  <Input
                    id="proposedName3"
                    placeholder="Another alternative"
                    value={companyData.proposedName3}
                    onChange={(e) =>
                      setCompanyData({
                        ...companyData,
                        proposedName3: e.target.value,
                      })
                    }
                  />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Business Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="businessNature">Nature of Business *</Label>
                  <Textarea
                    id="businessNature"
                    placeholder="e.g., Software development, IT consulting, and digital services"
                    value={companyData.businessNature}
                    onChange={(e) =>
                      setCompanyData({
                        ...companyData,
                        businessNature: e.target.value,
                      })
                    }
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="businessAddress">Business Address *</Label>
                  <Textarea
                    id="businessAddress"
                    placeholder="Full business address in Nigeria"
                    value={companyData.businessAddress}
                    onChange={(e) =>
                      setCompanyData({
                        ...companyData,
                        businessAddress: e.target.value,
                      })
                    }
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Director 1 / Founder Information *</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Primary director/founder details
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="director1Name">Full Name *</Label>
                  <Input
                    id="director1Name"
                    placeholder="As it appears on government ID"
                    value={companyData.director1Name}
                    onChange={(e) =>
                      setCompanyData({
                        ...companyData,
                        director1Name: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="director1Email">Email Address *</Label>
                  <Input
                    id="director1Email"
                    type="email"
                    placeholder="email@example.com"
                    value={companyData.director1Email}
                    onChange={(e) =>
                      setCompanyData({
                        ...companyData,
                        director1Email: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="director1Phone">Phone Number *</Label>
                  <Input
                    id="director1Phone"
                    placeholder="e.g., +234 801 234 5678"
                    value={companyData.director1Phone}
                    onChange={(e) =>
                      setCompanyData({
                        ...companyData,
                        director1Phone: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="director1Address">
                    Residential Address *
                  </Label>
                  <Textarea
                    id="director1Address"
                    placeholder="Full residential address"
                    value={companyData.director1Address}
                    onChange={(e) =>
                      setCompanyData({
                        ...companyData,
                        director1Address: e.target.value,
                      })
                    }
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="director1BVN">
                    Bank Verification Number (BVN) *
                  </Label>
                  <Input
                    id="director1BVN"
                    placeholder="11-digit BVN"
                    maxLength={11}
                    value={companyData.director1BVN}
                    onChange={(e) =>
                      setCompanyData({
                        ...companyData,
                        director1BVN: e.target.value,
                      })
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Required for CAC registration
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Director 2 / Co-Founder Information</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Optional - Add if you have a co-founder or second director
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="director2Name">Full Name</Label>
                  <Input
                    id="director2Name"
                    placeholder="Co-founder name (optional)"
                    value={companyData.director2Name}
                    onChange={(e) =>
                      setCompanyData({
                        ...companyData,
                        director2Name: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="director2Email">Email Address</Label>
                  <Input
                    id="director2Email"
                    type="email"
                    placeholder="email@example.com"
                    value={companyData.director2Email}
                    onChange={(e) =>
                      setCompanyData({
                        ...companyData,
                        director2Email: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="director2Phone">Phone Number</Label>
                  <Input
                    id="director2Phone"
                    placeholder="e.g., +234 801 234 5678"
                    value={companyData.director2Phone}
                    onChange={(e) =>
                      setCompanyData({
                        ...companyData,
                        director2Phone: e.target.value,
                      })
                    }
                  />
                </div>
              </CardContent>
            </Card>
            {companyData.cacPackage === "limited-company" && (
              <Card>
                <CardHeader>
                  <CardTitle>Company Secretary Information *</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Required for Limited Liability Company registration
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="secretaryName">Full Name *</Label>
                    <Input
                      id="secretaryName"
                      placeholder="Company secretary name"
                      value={companyData.secretaryName}
                      onChange={(e) =>
                        setCompanyData({
                          ...companyData,
                          secretaryName: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="secretaryEmail">Email Address *</Label>
                    <Input
                      id="secretaryEmail"
                      type="email"
                      placeholder="email@example.com"
                      value={companyData.secretaryEmail}
                      onChange={(e) =>
                        setCompanyData({
                          ...companyData,
                          secretaryEmail: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="secretaryPhone">Phone Number *</Label>
                    <Input
                      id="secretaryPhone"
                      placeholder="e.g., +234 801 234 5678"
                      value={companyData.secretaryPhone}
                      onChange={(e) =>
                        setCompanyData({
                          ...companyData,
                          secretaryPhone: e.target.value,
                        })
                      }
                    />
                  </div>
                </CardContent>
              </Card>
            )}
            <Card className="border-primary">
              <CardHeader>
                <CardTitle>Complete Registration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-muted rounded-lg space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Package:</span>
                    <span className="font-semibold">
                      {selectedCACPackage.name}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Processing Time:</span>
                    <span className="font-semibold">
                      {selectedCACPackage.timeline}
                    </span>
                  </div>
                  <div className="border-t pt-2 flex justify-between items-center">
                    <span className="font-semibold">Total Amount:</span>
                    <span className="text-2xl font-bold text-primary">
                      {selectedCACPackage.price}
                    </span>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentStep("new-select")}
                    className="flex-1"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                  </Button>
                  <Button
                    onClick={() =>
                      handlePayment(
                        selectedCACPackage.name,
                        selectedCACPackage.price,
                      )
                    }
                    className="flex-1 gap-2"
                    size="lg"
                  >
                    <CreditCard className="w-4 h-4" />
                    Proceed to Payment
                  </Button>
                </div>
                <Button
                  onClick={saveAndContinue}
                  variant="outline"
                  className="w-full"
                >
                  Save Progress & Continue Later
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          </>
        )}
        {currentStep === "delaware-form" && (
          <>
            <Card className="border-primary/50 bg-primary/5">
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">Delaware LLC Registration</p>
                    <p className="text-sm text-muted-foreground">
                      Complete the form below to proceed
                    </p>
                  </div>
                  <Badge className="text-lg px-4 py-1">
                    {delawarePackage.price}
                  </Badge>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Company Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="delawareCompanyName">
                    Proposed Company Name *
                  </Label>
                  <Input
                    id="delawareCompanyName"
                    placeholder="e.g., StartupVerse Technologies LLC"
                    value={companyData.delawareCompanyName}
                    onChange={(e) =>
                      setCompanyData({
                        ...companyData,
                        delawareCompanyName: e.target.value,
                      })
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Must end with "LLC" or "Limited Liability Company"
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="businessNature">Business Purpose *</Label>
                  <Textarea
                    id="businessNature"
                    placeholder="e.g., Software development, IT consulting, and digital services"
                    value={companyData.businessNature}
                    onChange={(e) =>
                      setCompanyData({
                        ...companyData,
                        businessNature: e.target.value,
                      })
                    }
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Organizer / Founder Information *</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="director1Name">Full Name *</Label>
                  <Input
                    id="director1Name"
                    placeholder="As it appears on passport/ID"
                    value={companyData.director1Name}
                    onChange={(e) =>
                      setCompanyData({
                        ...companyData,
                        director1Name: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="director1Email">Email Address *</Label>
                  <Input
                    id="director1Email"
                    type="email"
                    placeholder="email@example.com"
                    value={companyData.director1Email}
                    onChange={(e) =>
                      setCompanyData({
                        ...companyData,
                        director1Email: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="director1Phone">Phone Number *</Label>
                  <Input
                    id="director1Phone"
                    placeholder="International format (e.g., +234 801 234 5678)"
                    value={companyData.director1Phone}
                    onChange={(e) =>
                      setCompanyData({
                        ...companyData,
                        director1Phone: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="director1Address">
                    Residential Address *
                  </Label>
                  <Textarea
                    id="director1Address"
                    placeholder="Full address including country"
                    value={companyData.director1Address}
                    onChange={(e) =>
                      setCompanyData({
                        ...companyData,
                        director1Address: e.target.value,
                      })
                    }
                    rows={2}
                  />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Registered Agent</CardTitle>
                <p className="text-sm text-muted-foreground">
                  We'll provide a registered agent service (included in package)
                </p>
              </CardHeader>
              <CardContent>
                <div className="p-4 bg-muted rounded-lg">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold mb-1">
                        Registered Agent Service Included
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Our partner will provide a Delaware registered agent for
                        your LLC (first year included)
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-primary">
              <CardHeader>
                <CardTitle>Complete Registration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-muted rounded-lg space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Package:</span>
                    <span className="font-semibold">
                      {delawarePackage.name}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Processing Time:</span>
                    <span className="font-semibold">
                      {delawarePackage.timeline}
                    </span>
                  </div>
                  <div className="border-t pt-2 flex justify-between items-center">
                    <span className="font-semibold">Total Amount:</span>
                    <span className="text-2xl font-bold text-primary">
                      {delawarePackage.price}
                    </span>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentStep("new-select")}
                    className="flex-1"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                  </Button>
                  <Button
                    onClick={() =>
                      handlePayment(delawarePackage.name, delawarePackage.price)
                    }
                    className="flex-1 gap-2"
                    size="lg"
                  >
                    <CreditCard className="w-4 h-4" />
                    Proceed to Payment
                  </Button>
                </div>
                <Button
                  onClick={saveAndContinue}
                  variant="outline"
                  className="w-full"
                >
                  Save Progress & Continue Later
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
