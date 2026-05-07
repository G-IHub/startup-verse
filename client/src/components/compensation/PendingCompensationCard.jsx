import React, { useEffect, useState, useCallback } from "react";
import {
  Card,
  CardContent,
  CardHeader,
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

  const loadPendingMembers = useCallback(async () => {
    if (!startupId) return;
    setLoading(true);
    try {
      const result = await compensationApi.getPendingTeamMembers(startupId);
      if (result.success) {
        setPendingMembers(result.pendingMembers || []);
      }
    } catch (error) {
      console.error("Failed to load pending team members:", error);
    } finally {
      setLoading(false);
    }
  }, [startupId]);

  useEffect(() => {
    loadPendingMembers();
  }, [loadPendingMembers]);

  if (loading) {
    return null;
  }
  if (pendingMembers.length === 0) {
    return null;
  }

  const count = pendingMembers.length;

  const handleSetupCompensation = (member) => {
    setSelectedMember(member);
    setShowWizard(true);
  };

  const handleCompensationComplete = async (compensationConfig) => {
    if (!selectedMember) return;
    setSettingCompensation(true);
    try {
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
        setShowWizard(false);
        setSelectedMember(null);
        await loadPendingMembers();
        onCompensationSet?.();
      }
    } catch (error) {
      console.error("Failed to create compensation contract:", error);
      toast.error("Failed to set compensation", {
        description: "Please try again or contact support.",
      });
    } finally {
      setSettingCompensation(false);
    }
  };

  return (
    <>
      <Card className="overflow-hidden rounded-[14px] border border-primary/18 bg-white text-[#4a4a5a] shadow-[var(--shadow-soft)]">
        <CardHeader className="space-y-0 border-b border-primary/12 bg-[#fafbff] px-4 py-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 flex-1 items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/[0.09] text-primary">
                <AlertCircle className="h-4 w-4" aria-hidden />
              </span>
              <div className="min-w-0">
                <p className="font-heading text-[15px] font-semibold tracking-tight text-[#0d0d0d]">
                  Compensation pending
                </p>
                <p className="mt-1 text-xs leading-snug text-[#4a4a5a]">
                  {count === 1
                    ? "One teammate accepted your invite but still needs a compensation package for full access."
                    : `${count} teammates accepted invites but still need compensation packages for full access.`}
                </p>
              </div>
            </div>
            <Badge
              variant="outline"
              className="h-7 shrink-0 gap-1 border-primary/18 bg-white px-2.5 text-[11px] font-semibold tabular-nums text-[#1a237e]"
            >
              <Users className="h-3.5 w-3.5 opacity-80" aria-hidden />
              {count}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-2 px-4 py-3">
          {pendingMembers.map((member) => (
            <div
              key={member.id}
              className="flex flex-col gap-3 rounded-xl border border-primary/12 bg-[#f4f5ff]/60 p-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
            >
              <div className="flex min-w-0 items-center gap-3">
                <Avatar className="h-9 w-9 border border-primary/10">
                  <AvatarImage src={member.avatar} alt="" />
                  <AvatarFallback className="bg-primary/[0.08] text-[11px] font-semibold text-[#1a237e]">
                    {member.name
                      ?.split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase() || "?"}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[#0d0d0d]">
                    {member.name}
                  </p>
                  <p className="truncate text-[11px] text-[#6b6b7a]">
                    {member.role || "Team member"}
                    {" · Joined "}
                    {new Date(
                      member.joinedAt || member.createdAt,
                    ).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>
              <Button
                type="button"
                size="sm"
                disabled={settingCompensation}
                onClick={() => handleSetupCompensation(member)}
                className="h-8 shrink-0 gap-1.5 rounded-input px-3 text-[11px] font-semibold shadow-[0_4px_16px_rgba(58,90,254,0.18)] sm:self-center"
              >
                {settingCompensation ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                ) : (
                  <DollarSign className="h-3.5 w-3.5" aria-hidden />
                )}
                Set compensation
                <ArrowRight className="h-3.5 w-3.5 opacity-90" aria-hidden />
              </Button>
            </div>
          ))}
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
