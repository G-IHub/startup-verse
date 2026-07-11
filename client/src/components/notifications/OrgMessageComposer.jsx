import React, { useEffect, useState } from "react";
import { Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import * as organizationApi from "../../utils/api/organizationApi";
import { INBOX_OUTLINE_BTN, INBOX_PRIMARY_BTN } from "../../utils/inboxNormalize";

/**
 * Founder → organization message composer (moved from Inbox page into the bell hub).
 */
export default function OrgMessageComposer({
  open,
  onOpenChange,
  user,
  onSend,
  isSending = false,
}) {
  const userId = user?._id || user?.id;
  const [cohorts, setCohorts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ cohortId: "", subject: "", message: "" });

  useEffect(() => {
    if (!open || !userId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const result = await organizationApi.getFounderMemberships(userId);
        const list = Array.isArray(result)
          ? result
          : result?.memberships || result?.items || [];
        if (!cancelled) {
          setCohorts(
            list
              .map((m) => ({
                id: String(m.cohortId || m.cohort?.id || m.id || ""),
                organizationId: String(
                  m.organizationId ||
                    m.organization?.id ||
                    m.orgId ||
                    m.cohort?.organizationId ||
                    "",
                ),
                label:
                  m.cohort?.name ||
                  m.cohortName ||
                  m.organization?.name ||
                  m.organizationName ||
                  "Program",
              }))
              .filter((c) => c.id),
          );
        }
      } catch {
        if (!cancelled) setCohorts([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, userId]);

  const reset = () => setForm({ cohortId: "", subject: "", message: "" });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cohort = cohorts.find((c) => c.id === form.cohortId);
    if (!cohort) {
      toast.error("Please select an organization");
      return;
    }
    const ok = await onSend?.({
      cohort,
      subject: form.subject.trim(),
      message: form.message.trim(),
    });
    if (ok) {
      reset();
      onOpenChange?.(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset();
        onOpenChange?.(next);
      }}
    >
      <DialogContent className="max-w-lg rounded-card border border-surface-border bg-surface-card shadow-modal">
        <DialogHeader>
          <DialogTitle className="font-heading text-text-heading">
            Message organization
          </DialogTitle>
          <DialogDescription className="font-body text-sm text-text-body">
            Send a message to your accelerator or program
          </DialogDescription>
        </DialogHeader>
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-8 font-body text-sm text-text-muted">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            Loading programs…
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label className="font-body text-sm text-text-heading">Organization</Label>
              <select
                value={form.cohortId}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, cohortId: e.target.value }))
                }
                className="h-10 w-full rounded-input border border-surface-border bg-surface-card px-3 font-body text-[13px] text-text-heading"
                required
              >
                <option value="">Select a program</option>
                {cohorts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label className="font-body text-sm text-text-heading">Subject</Label>
              <input
                value={form.subject}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, subject: e.target.value }))
                }
                className="h-10 w-full rounded-input border border-surface-border bg-surface-card px-3 font-body text-[13px] text-text-heading"
                required
              />
            </div>
            <div className="space-y-2">
              <Label className="font-body text-sm text-text-heading">Message</Label>
              <Textarea
                value={form.message}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, message: e.target.value }))
                }
                className="min-h-[120px] rounded-input border-surface-border font-body text-[13px]"
                required
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                className={INBOX_OUTLINE_BTN}
                onClick={() => {
                  reset();
                  onOpenChange?.(false);
                }}
              >
                Cancel
              </Button>
              <Button type="submit" className={INBOX_PRIMARY_BTN} disabled={isSending}>
                {isSending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Send className="mr-2 h-4 w-4" />
                )}
                Send Message
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
