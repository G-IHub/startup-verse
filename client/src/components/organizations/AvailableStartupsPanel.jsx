import React, { useState, useEffect, useCallback } from "react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Search, Send, Mail } from "lucide-react";
import { toast } from "sonner";
import { toastError } from "../../utils/toastError";
import {
  createInvitation,
  getAvailableStartups,
} from "../../utils/organizationHelpersBackend";
import {
  buildDefaultInviteMessage,
  parseApiError,
} from "../../utils/inviteStartupHelpers";
import { ListRow, StatusBadge } from "./_primitives";

const PRIMARY_BUTTON =
  "h-8 rounded-input bg-primary px-3 font-body text-[12px] font-semibold text-white shadow-[0_4px_16px_rgba(58,90,254,0.25)] hover:bg-primary-hover";

export default function AvailableStartupsPanel({
  cohortId,
  cohortName,
  organizationId,
  userId,
  onInviteSuccess,
  onInviteByEmail,
  variant = "page",
  showEmailSecondary = true,
}) {
  const [startups, setStartups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [invitingId, setInvitingId] = useState(null);
  const [rowErrors, setRowErrors] = useState({});

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery.trim()), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const loadStartups = useCallback(async () => {
    try {
      setLoading(true);
      const result = await getAvailableStartups(cohortId, {
        q: debouncedQuery || undefined,
      });
      setStartups(result.items || []);
    } catch (error) {
      console.error("Failed to load available startups:", error);
      toastError(error, "Failed to load available startups.");
      setStartups([]);
    } finally {
      setLoading(false);
    }
  }, [cohortId, debouncedQuery]);

  useEffect(() => {
    loadStartups();
  }, [loadStartups]);

  const handleInvite = async (startup) => {
    if (startup.inviteStatus === "pending") return;

    setInvitingId(startup.id);
    setRowErrors((prev) => ({ ...prev, [startup.id]: "" }));

    try {
      const message = buildDefaultInviteMessage(startup.name, cohortName);
      await createInvitation(
        cohortId,
        organizationId,
        startup.founderId,
        startup.founderEmail,
        startup.founderName,
        startup.name,
        userId,
        message,
      );
      toast.success(`Invitation sent to ${startup.name}`);
      setStartups((prev) =>
        prev.map((row) =>
          row.id === startup.id ? { ...row, inviteStatus: "pending" } : row,
        ),
      );
      if (onInviteSuccess) onInviteSuccess();
    } catch (error) {
      console.error("Failed to send invitation:", error);
      const parsed = parseApiError(error);
      const message =
        parsed.status === 409
          ? parsed.message ||
            "A pending invitation already exists for this founder."
          : parsed.message || "Failed to send invitation.";
      setRowErrors((prev) => ({ ...prev, [startup.id]: message }));
      toastError({ status: parsed.status, message }, message);
    } finally {
      setInvitingId(null);
    }
  };

  const isCompact = variant === "modal";
  const listMaxHeight = isCompact ? "max-h-[320px]" : "max-h-[480px]";

  return (
    <div className="space-y-3 font-body">
      {!isCompact && (
        <div>
          <p className="font-body text-[13px] text-text-body">
            Browse registered startups and invite them to join this cohort.
          </p>
        </div>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by name, industry, or stage..."
          className="pl-9 font-body text-[13px]"
        />
      </div>

      {loading ? (
        <div className="space-y-2 py-4">
          {[1, 2, 3].map((key) => (
            <div
              key={key}
              className="h-14 animate-pulse rounded-[12px] bg-surface-page"
            />
          ))}
        </div>
      ) : startups.length === 0 ? (
        <div className="rounded-input border border-dashed border-surface-border py-8 text-center">
          <p className="font-body text-[13px] text-text-body">
            {debouncedQuery
              ? "No startups match your search."
              : "No startups available to invite right now."}
          </p>
        </div>
      ) : (
        <div className={`space-y-2 overflow-y-auto ${listMaxHeight}`}>
          {startups.map((startup) => {
            const meta = [startup.stage, startup.industry]
              .filter(Boolean)
              .join(" · ");
            const isPending = startup.inviteStatus === "pending";
            const isInviting = invitingId === startup.id;

            return (
              <div key={startup.id} className="space-y-1">
                <ListRow
                  leading={
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-tint font-heading text-[13px] font-bold text-primary">
                      {(startup.name || "?").charAt(0).toUpperCase()}
                    </div>
                  }
                  title={startup.name}
                  description={startup.founderName || startup.founderEmail}
                  meta={meta || undefined}
                  trailing={
                    isPending ? (
                      <StatusBadge status="invited" label="Invited" />
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => handleInvite(startup)}
                        className={PRIMARY_BUTTON}
                        disabled={isInviting}
                      >
                        <Send className="mr-1.5 h-3.5 w-3.5" />
                        {isInviting ? "Sending..." : "Invite"}
                      </Button>
                    )
                  }
                />
                {rowErrors[startup.id] && (
                  <p className="px-3 font-body text-[12px] text-error">
                    {rowErrors[startup.id]}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showEmailSecondary && onInviteByEmail && (
        <div className="border-t border-surface-border pt-3 text-center">
          <button
            type="button"
            onClick={onInviteByEmail}
            className="inline-flex items-center gap-1.5 font-body text-[13px] font-medium text-primary hover:underline"
          >
            <Mail className="h-4 w-4" />
            Invite by email instead
          </button>
        </div>
      )}
    </div>
  );
}
