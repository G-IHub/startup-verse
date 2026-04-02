import React, { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import {
  AlertCircle,
  DollarSign,
  Users,
  ArrowRight,
  Loader2,
} from "lucide-react";
import * as compensationApi from "../../utils/api/compensationApi";
import CompensationSetupWizard from "./CompensationSetupWizard";
import { toast } from "sonner";
export default function PendingCompensationCard({
  startupId,
  founderId,
  onCompensationSet,
}) {
  const [pendingMembers, setPendingMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMember, setSelectedMember] = useState(null);
  const [showWizard, setShowWizard] = useState(false);
  const [settingCompensation, setSettingCompensation] = useState(false);
  useEffect(() => {
    loadPendingMembers();
  }, [startupId]);
  const loadPendingMembers = async () => {
    setLoading(true);
    try {
      const result = await compensationApi.getPendingTeamMembers(startupId);
      if (result.success) {
        setPendingMembers(result.pendingMembers || []);
        console.log("✅ Loaded pending team members:", result.pendingMembers);
      }
    } catch (error) {
      console.error("❌ Failed to load pending team members:", error);
    } finally {
      setLoading(false);
    }
  };
  const handleSetupCompensation = (member) => {
    setSelectedMember(member);
    setShowWizard(true);
  };
  const handleCompensationComplete = async (compensationConfig) => {
    if (!selectedMember) return;
    setSettingCompensation(true);
    try {
      console.log("🎯 Creating compensation contract...", {
        founderId,
        teamMemberId: selectedMember.id,
        startupId,
        compensationConfig,
      });
      const result = await compensationApi.createCompensationContract(
        founderId,
        selectedMember.id,
        startupId,
        compensationConfig,
      );
      if (result.success) {
        toast.success(`Compensation set for ${selectedMember.name}!`, {
          description: "They now have full access to all features.",
        });

        // Close wizard
        setShowWizard(false);
        setSelectedMember(null);

        // Reload pending members
        await loadPendingMembers();

        // Notify parent component
        onCompensationSet?.();
      }
    } catch (error) {
      console.error("❌ Failed to create compensation contract:", error);
      toast.error("Failed to set compensation", {
        description: "Please try again or contact support.",
      });
    } finally {
      setSettingCompensation(false);
    }
  };

  // Don't show the card if there are no pending members
  if (!loading && pendingMembers.length === 0) {
    return null;
  }
  return (
    <>
      <Card className="border-amber-500/50 bg-amber-50 dark:bg-amber-950/20">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-500" />
              </div>
              <div>
                <CardTitle className="text-amber-900 dark:text-amber-100">
                  Action Required: Set Compensation
                </CardTitle>
                <CardDescription className="text-amber-700 dark:text-amber-300 mt-1">
                  {pendingMembers.length}
                  {" team "}
                  {pendingMembers.length === 1
                    ? "member needs"
                    : "members need"}
                  {" compensation setup"}
                </CardDescription>
              </div>
            </div>
            <Badge
              variant="outline"
              className="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700"
            >
              <Users className="w-3 h-3 mr-1" />
              {pendingMembers.length}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-amber-600" />
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-amber-800 dark:text-amber-200 mb-4">
                Team members have limited access until you set up their
                compensation packages.
              </p>
              {pendingMembers.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-3 bg-white dark:bg-gray-900 rounded-lg border border-amber-200 dark:border-amber-800"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={member.avatar} />
                      <AvatarFallback className="bg-primary/10 text-primary text-sm">
                        {member.name
                          ?.split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase() || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm">{member.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {member.role || "Team Member"}
                        {" • Joined "}
                        {new Date(
                          member.joinedAt || member.createdAt,
                        ).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleSetupCompensation(member)}
                    className="gap-2"
                  >
                    <DollarSign className="w-4 h-4" />
                    Set Compensation
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      {selectedMember && (
        <CompensationSetupWizard
          isOpen={showWizard}
          onClose={() => {
            setShowWizard(false);
            setSelectedMember(null);
          }}
          teamMemberName={selectedMember.name}
          teamMemberId={selectedMember.id}
          founderId={founderId}
          startupId={startupId}
          onComplete={handleCompensationComplete}
        />
      )}
    </>
  );
}
