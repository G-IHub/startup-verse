import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { CheckCircle2, X, Users, Eye, Lock, AlertCircle } from "lucide-react";
import {
  respondToInvitation,
  getOrganization,
  getCohort,
} from "../../utils/organizationHelpersBackend";
import { toastError } from "../../utils/toastError";
export default function CohortInvitationCard({ invitation, onRespond }) {
  const [isResponding, setIsResponding] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [organization, setOrganization] = useState(null);
  const [cohort, setCohort] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [org, coh] = await Promise.all([
          getOrganization(invitation.organizationId),
          getCohort(invitation.cohortId),
        ]);
        setOrganization(org);
        setCohort(coh);
      } catch (error) {
        console.error("Failed to fetch invitation details:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [invitation.organizationId, invitation.cohortId]);
  const handleRespond = async (accept) => {
    setIsResponding(true);
    try {
      await respondToInvitation(
        invitation.id,
        invitation.founderId,
        accept ? "accepted" : "declined",
      );
      if (onRespond) {
        onRespond();
      }
    } catch (error) {
      console.error("Failed to respond to invitation:", error);
      toastError(error, "Failed to respond to invitation. Please try again.");
    } finally {
      setIsResponding(false);
    }
  };
  if (isLoading) {
    return (
      <Card className="border-2 border-primary/20">
        <CardContent className="py-6 text-center text-sm text-muted-foreground">
          Loading invitation...
        </CardContent>
      </Card>
    );
  }
  if (!organization || !cohort) {
    return null;
  }
  return (
    <Card className="border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-purple-50/50">
      <CardHeader className="pb-2 pt-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-[10px] flex items-center gap-1.5">
              <Users className="w-4 h-4 text-primary" />
              Cohort Invitation
            </CardTitle>
            <CardDescription className="mt-0.5 text-[9px]">
              {organization.name}
            </CardDescription>
          </div>
          <Badge className="bg-primary text-white text-[8px] px-1.5 py-0">New</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2.5">
        <div className="p-2.5 bg-white rounded-lg border">
          <p className="text-[10px] font-semibold mb-1">
            {"You've been invited to join: "}
            <span className="text-primary">{cohort.name}</span>
          </p>
          {invitation.message && (
            <p className="text-[9px] text-muted-foreground italic">
              "{invitation.message}"
            </p>
          )}
        </div>
        <div>
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-[10px] font-semibold text-primary hover:underline flex items-center gap-1"
          >
            {showDetails ? "▼" : "▶"}
            {" What "}
            {organization.name}
            {" can see"}
          </button>
          {showDetails && (
            <div className="mt-2 p-2 bg-muted/50 rounded-lg space-y-1.5">
              <div className="flex items-start gap-2 text-[9px]">
                <Eye className="w-3 h-3 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-green-700">
                    They CAN see:
                  </p>
                  <ul className="list-disc list-inside text-muted-foreground mt-0.5 space-y-0.5">
                    <li>Your execution progress (tasks, milestones)</li>
                    <li>Team size and activity levels</li>
                    <li>Current startup stage (algorithmically determined)</li>
                    <li>Weekly execution streak</li>
                  </ul>
                </div>
              </div>
              <div className="flex items-start gap-2 text-[9px]">
                <Lock className="w-3 h-3 text-red-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-red-700">
                    They CANNOT:
                  </p>
                  <ul className="list-disc list-inside text-muted-foreground mt-0.5 space-y-0.5">
                    <li>Edit your tasks or milestones</li>
                    <li>Message your team directly</li>
                    <li>See private notes or details</li>
                    <li>Change your startup data</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="p-2 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex gap-2">
            <AlertCircle className="w-3.5 h-3.5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-[9px] text-blue-900">
              <p className="font-medium mb-0.5">Why join?</p>
              <p className="text-blue-700">
                {"Being part of "}
                {cohort.name}
                {
                  " gives organizers visibility into your progress so they can provide better support, mentorship, and resources."
                }
              </p>
            </div>
          </div>
        </div>
        <div className="flex gap-2 pt-1">
          <Button
            onClick={() => handleRespond(false)}
            variant="outline"
            className="flex-1 h-7 text-[10px]"
            disabled={isResponding}
          >
            <X className="w-3 h-3 mr-1" />
            Decline
          </Button>
          <Button
            onClick={() => handleRespond(true)}
            className="flex-1 h-7 text-[10px]"
            disabled={isResponding}
          >
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Accept Invitation
          </Button>
        </div>
        <p className="text-[8px] text-center text-muted-foreground">
          You can leave this cohort at any time from your settings
        </p>
      </CardContent>
    </Card>
  );
}
