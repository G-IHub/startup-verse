import React, { useEffect, useState } from "react";
import { MessageCircle, Users } from "lucide-react";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import * as orgApi from "../../utils/api/organizationApi";
import {
  ProgramEmptyState,
  ProgramPanelShell,
  PROGRAM_ROW,
} from "./ProgramPanelShell";

export default function ProgramMentorsPanel({ founderId, onNavigate }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!founderId) {
        setItems([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      setError("");
      try {
        const mentors = await orgApi.getFounderMentors(founderId);
        if (!cancelled) setItems(Array.isArray(mentors) ? mentors : []);
      } catch (err) {
        console.error("Failed to load mentors:", err);
        if (!cancelled) {
          setError("Could not load assigned mentors.");
          setItems([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [founderId]);

  return (
    <ProgramPanelShell
      icon={Users}
      title="Your mentors"
      description="Mentors assigned by the organization to support your startup."
    >
      {loading ? (
        <p className="font-body text-sm text-text-muted">Loading mentors…</p>
      ) : error ? (
        <p className="font-body text-sm text-status-error">{error}</p>
      ) : items.length === 0 ? (
        <ProgramEmptyState
          icon={Users}
          title="No mentor assigned yet"
          description="When the organization assigns a mentor to your founder, they will appear here with a way to reach them."
        />
      ) : (
        items.map((mentor) => (
          <div
            key={mentor.id}
            className={`${PROGRAM_ROW} flex flex-wrap items-center justify-between gap-3`}
          >
            <div className="min-w-0">
              <p className="font-heading text-sm font-bold text-text-heading">
                {mentor.name || "Mentor"}
              </p>
              <p className="font-body text-xs text-text-muted">
                {mentor.organizationName || "Organization"}
                {mentor.email ? ` · ${mentor.email}` : ""}
              </p>
              {Array.isArray(mentor.expertise) && mentor.expertise.length > 0 ? (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {mentor.expertise.slice(0, 4).map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              ) : null}
            </div>
            {mentor.userId ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() =>
                  onNavigate?.("founder-chat", {
                    messageUserId: String(mentor.userId),
                  })
                }
              >
                <MessageCircle className="mr-1.5 h-3.5 w-3.5" aria-hidden />
                Message
              </Button>
            ) : null}
          </div>
        ))
      )}
    </ProgramPanelShell>
  );
}
