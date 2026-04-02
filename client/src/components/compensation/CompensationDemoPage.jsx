import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Avatar, AvatarFallback } from "../ui/avatar";
import CompensationSetupWizard from "../compensation/CompensationSetupWizard";
import { createCompensationContract } from "../../utils/api/compensationApi";
import { toast } from "sonner";
import { User, CheckCircle2, Clock, Users } from "lucide-react";
export default function CompensationDemoPage({ user }) {
  const [showWizard, setShowWizard] = useState(false);
  const [selectedTalent, setSelectedTalent] = useState(null);
  const [contracts, setContracts] = useState([]);
  const [acceptedApplicationIds, setAcceptedApplicationIds] = useState([]);

  // Mock talent applications
  const mockApplications = [
    {
      id: "app-1",
      talentId: "talent-001",
      talentName: "Sarah Chen",
      talentEmail: "sarah@example.com",
      role: "Senior Full-Stack Engineer",
      skills: ["React", "Node.js", "TypeScript", "PostgreSQL"],
      experience: "5 years",
      matchScore: 95,
      appliedDate: "2026-01-10",
      status: "pending",
    },
    {
      id: "app-2",
      talentId: "talent-002",
      talentName: "Michael Rodriguez",
      talentEmail: "michael@example.com",
      role: "Product Designer",
      skills: ["Figma", "UI/UX", "User Research", "Prototyping"],
      experience: "4 years",
      matchScore: 88,
      appliedDate: "2026-01-12",
      status: "pending",
    },
    {
      id: "app-3",
      talentId: "talent-003",
      talentName: "Emily Watson",
      talentEmail: "emily@example.com",
      role: "Marketing Lead",
      skills: ["Growth Marketing", "SEO", "Content Strategy", "Analytics"],
      experience: "6 years",
      matchScore: 92,
      appliedDate: "2026-01-14",
      status: "pending",
    },
  ];

  // Filter out accepted applications
  const pendingApplications = mockApplications.filter(
    (app) => !acceptedApplicationIds.includes(app.id),
  );
  const handleAcceptTalent = (application) => {
    setSelectedTalent(application);
    setShowWizard(true);
  };
  const handleCompensationComplete = async (compensationConfig) => {
    console.log(
      "📥 handleCompensationComplete called with config:",
      compensationConfig,
    );
    if (!selectedTalent) {
      console.error("❌ No selected talent!");
      return;
    }
    console.log("👤 Selected talent:", selectedTalent);
    console.log(
      "🏢 Creating contract for startup:",
      user.startupId || user.companyId || "demo-startup-id",
    );
    try {
      // Create the compensation contract
      console.log("🚀 Calling createCompensationContract API...");
      const result = await createCompensationContract(
        user.id,
        selectedTalent.talentId,
        user.startupId || user.companyId || "demo-startup-id",
        compensationConfig,
      );
      console.log("📊 API Result:", result);
      if (result.success) {
        toast.success(
          `✅ Compensation contract created for ${selectedTalent.talentName}!`,
        );

        // Mark application as accepted (remove from pending)
        setAcceptedApplicationIds([
          ...acceptedApplicationIds,
          selectedTalent.id,
        ]);

        // Add to local contracts list
        setContracts([
          ...contracts,
          {
            ...result.contract,
            talentName: selectedTalent.talentName,
            talentRole: selectedTalent.role,
            applicationId: selectedTalent.id,
          },
        ]);
        console.log("✅ Contract added to local state");

        // Close wizard
        setShowWizard(false);
        setSelectedTalent(null);
        console.log("✅ Wizard closed");
      } else {
        console.error("❌ API returned success: false");
        toast.error("Failed to create compensation contract");
      }
    } catch (error) {
      console.error("❌ Error creating compensation contract:", error);
      toast.error(
        `Failed to create compensation contract: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  };
  return (
    <div className="p-2 md:p-3 space-y-2 md:space-y-2.5">
      <div className="space-y-1">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 dark:bg-primary/20 rounded-lg flex items-center justify-center">
            <Users className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Compensation System Demo</h1>
            <p className="text-sm text-muted-foreground">
              Accept talent and set up their compensation contract
            </p>
          </div>
        </div>
      </div>
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 border-blue-200 dark:border-blue-800">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
                Complete Compensation Flow
              </p>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                This demo shows the complete flow: Accept Talent → Set
                Compensation → Create Contract. Try accepting one of the talent
                below to set up their compensation package.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="w-5 h-5" />
              Pending Applications
            </CardTitle>
            <CardDescription className="text-xs">
              Review and accept talent to set up compensation
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingApplications.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle2 className="w-12 h-12 text-green-600 dark:text-green-400 mx-auto mb-3 opacity-50" />
                <p className="text-sm font-medium mb-1">
                  All Applications Processed! 🎉
                </p>
                <p className="text-xs text-muted-foreground">
                  You've accepted all pending talent. Check "Active Contracts"
                  to see your team.
                </p>
              </div>
            ) : (
              pendingApplications.map((application) => (
                <div
                  key={application.id}
                  className="p-3 border rounded-lg hover:border-primary/50 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <Avatar className="w-10 h-10 flex-shrink-0">
                      <AvatarFallback>
                        {application.talentName
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div>
                          <h3 className="font-semibold text-sm">
                            {application.talentName}
                          </h3>
                          <p className="text-xs text-muted-foreground">
                            {application.role}
                          </p>
                        </div>
                        <Badge
                          variant="outline"
                          className="text-xs flex-shrink-0"
                        >
                          {application.matchScore}% Match
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-1 mb-2">
                        {application.skills.slice(0, 3).map((skill, idx) => (
                          <Badge
                            key={idx}
                            variant="secondary"
                            className="text-xs"
                          >
                            {skill}
                          </Badge>
                        ))}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                        <span>
                          {application.experience}
                          {" experience"}
                        </span>
                        <span>•</span>
                        <span>
                          {"Applied "}
                          {new Date(
                            application.appliedDate,
                          ).toLocaleDateString()}
                        </span>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleAcceptTalent(application)}
                        className="w-full text-xs"
                      >
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Accept & Set Compensation
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CheckCircle2 className="w-5 h-5" />
              Active Contracts ({contracts.length})
            </CardTitle>
            <CardDescription className="text-xs">
              Compensation contracts you've created
            </CardDescription>
          </CardHeader>
          <CardContent>
            {contracts.length === 0 ? (
              <div className="text-center py-8">
                <User className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                <p className="text-sm font-medium mb-1">No Contracts Yet</p>
                <p className="text-xs text-muted-foreground">
                  Accept a talent to create your first compensation contract
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {contracts.map((contract, idx) => (
                  <div
                    key={idx}
                    className="p-3 border rounded-lg bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800"
                  >
                    <div className="flex items-start gap-3">
                      <Avatar className="w-8 h-8 flex-shrink-0">
                        <AvatarFallback className="text-xs">
                          {contract.talentName
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm">
                          {contract.talentName}
                        </h3>
                        <p className="text-xs text-muted-foreground mb-2">
                          {contract.talentRole}
                        </p>
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">Type:</span>
                            <Badge variant="outline" className="text-xs">
                              {contract.compensationType === "equity" &&
                                "💎 Equity Only"}
                              {contract.compensationType === "fixed" &&
                                "💰 Fixed Payment"}
                              {contract.compensationType === "hourly" &&
                                "⏰ Hourly Rate"}
                              {contract.compensationType === "equity-fixed" &&
                                "💎💰 Hybrid"}
                              {contract.compensationType === "unpaid" &&
                                "🤝 Unpaid"}
                            </Badge>
                          </div>
                          {contract.config.equity && (
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-muted-foreground">
                                Equity:
                              </span>
                              <span className="font-medium">
                                {contract.config.equity.totalEquity}%
                              </span>
                            </div>
                          )}
                          {contract.config.fixed && (
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-muted-foreground">
                                Payment:
                              </span>
                              <span className="font-medium">
                                ${contract.config.fixed.amount}/
                                {contract.config.fixed.paymentType === "monthly"
                                  ? "mo"
                                  : "once"}
                              </span>
                            </div>
                          )}
                          {contract.config.hourly && (
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-muted-foreground">
                                Rate:
                              </span>
                              <span className="font-medium">
                                ${contract.config.hourly.rate}/hr
                              </span>
                            </div>
                          )}
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">
                              Status:
                            </span>
                            <Badge variant="default" className="text-xs">
                              Active
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">How to Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex items-start gap-2">
            <Badge variant="outline" className="text-xs flex-shrink-0">
              1
            </Badge>
            <p>Click "Accept & Set Compensation" on any talent above</p>
          </div>
          <div className="flex items-start gap-2">
            <Badge variant="outline" className="text-xs flex-shrink-0">
              2
            </Badge>
            <p>
              The Compensation Setup Wizard will open with a multi-step flow
            </p>
          </div>
          <div className="flex items-start gap-2">
            <Badge variant="outline" className="text-xs flex-shrink-0">
              3
            </Badge>
            <p>
              Choose a compensation type (Equity, Fixed Payment, Hourly, Hybrid,
              or Unpaid)
            </p>
          </div>
          <div className="flex items-start gap-2">
            <Badge variant="outline" className="text-xs flex-shrink-0">
              4
            </Badge>
            <p>
              Configure all the details (vesting schedules, performance
              thresholds, payment terms)
            </p>
          </div>
          <div className="flex items-start gap-2">
            <Badge variant="outline" className="text-xs flex-shrink-0">
              5
            </Badge>
            <p>Review the summary and complete setup</p>
          </div>
          <div className="flex items-start gap-2">
            <Badge variant="outline" className="text-xs flex-shrink-0">
              6
            </Badge>
            <p>
              The contract will be created and saved to the backend, appearing
              in "Active Contracts"
            </p>
          </div>
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
            <p className="text-xs text-blue-700 dark:text-blue-300">
              <strong>💡 Tip:</strong>
              {
                " To see the team member's view, navigate to the \"Performance\" page in the sidebar. The compensation status will appear there (though you'll need to simulate being a team member with a contract)."
              }
            </p>
          </div>
        </CardContent>
      </Card>
      {showWizard && selectedTalent && (
        <CompensationSetupWizard
          isOpen={showWizard}
          onClose={() => {
            setShowWizard(false);
            setSelectedTalent(null);
          }}
          teamMemberName={selectedTalent.talentName}
          teamMemberId={selectedTalent.talentId}
          founderId={user.id}
          startupId={user.startupId || user.companyId || "demo-startup-id"}
          onComplete={handleCompensationComplete}
        />
      )}
    </div>
  );
}
