/**
 * TalentOffersPage
 * ─────────────────────────────────────────────────────────────────────────────
 * Real offer inbox for talent-role users — the missing counterpart to the
 * founder-side V2SendOfferModal (client/src/components/dashboards/V2SendOfferModal.jsx).
 * Was a genuine gap: offersApi.getReceivedOffers existed but nothing ever
 * called it, so a candidate had no real way to see or respond to an Offer
 * except a raw API call. See CLAUDE.md for the full writeup.
 *
 * Accepting here is real and consequential: the server
 * (offers.controller.js updateOfferStatus) transitions this user's role to
 * "team-member", creates a real TeamMemberProfile/OnboardingChecklist/
 * Presence/Activity, and there is no undo — matches what the offer's own
 * "before you send" copy promises the founder.
 */
import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { toast } from "sonner";
import * as offersApi from "../../utils/api/offersApi";
import { authApi } from "../../api/authApi";
import {
  Briefcase,
  MapPin,
  DollarSign,
  TrendingUp,
  Clock,
  Check,
  X,
  Loader2,
  Inbox as InboxIcon,
} from "lucide-react";

function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
}
function fmtMoney(currency, amount) {
  const n = Number(amount);
  if (!Number.isFinite(n) || n <= 0) return null;
  return `${currency || ""} ${n.toLocaleString()}`.trim();
}
function daysUntil(d) {
  if (!d) return null;
  const diff = Math.ceil((new Date(d).getTime() - Date.now()) / 86400000);
  return diff;
}

const STATUS_BADGE = {
  pending: { label: "Awaiting your response", variant: "secondary" },
  accepted: { label: "Accepted", variant: "default" },
  declined: { label: "Declined", variant: "outline" },
  expired: { label: "Expired", variant: "outline" },
  withdrawn: { label: "Withdrawn by founder", variant: "outline" },
};

function OfferCard({ offer, onOpen }) {
  const founderName = offer.founderId?.name || "A founder";
  const status = STATUS_BADGE[offer.status] || STATUS_BADGE.pending;
  const salary = fmtMoney(offer.currency, offer.salaryAmount);
  const expiry = daysUntil(offer.expiresAt);

  return (
    <Card className="cursor-pointer transition-shadow hover:shadow-md" onClick={() => onOpen(offer)}>
      <CardContent className="flex items-start justify-between gap-3 p-4">
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-2">
            <h4 className="truncate text-sm font-medium">{offer.role}</h4>
            <Badge variant={status.variant}>{status.label}</Badge>
          </div>
          <p className="mb-2 text-xs text-muted-foreground">From {founderName}</p>
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            {salary && (
              <span className="flex items-center gap-1"><DollarSign className="h-3 w-3" /> {salary}/mo</span>
            )}
            {offer.equityPercent ? (
              <span className="flex items-center gap-1"><TrendingUp className="h-3 w-3" /> {offer.equityPercent}% equity</span>
            ) : null}
            {offer.workLocation ? (
              <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {offer.workLocation}</span>
            ) : null}
            {offer.status === "pending" && expiry != null ? (
              <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {expiry > 0 ? `Expires in ${expiry}d` : "Expired"}</span>
            ) : null}
          </div>
        </div>
        <Button size="sm" variant="outline">View</Button>
      </CardContent>
    </Card>
  );
}

function OfferDetailDialog({ offer, open, onClose, onRespond, responding }) {
  if (!offer) return null;
  const founderName = offer.founderId?.name || "A founder";
  const salary = fmtMoney(offer.currency, offer.salaryAmount);
  const isPending = offer.status === "pending" && (!offer.expiresAt || new Date(offer.expiresAt) > new Date());
  const enabledKpis = (offer.kpis || []).filter((k) => k.enabled);
  const tier1 = (offer.performanceTiers || []).find((t) => t.tierNumber === 1);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Briefcase className="h-4 w-4" /> {offer.role}
          </DialogTitle>
          <DialogDescription>Offer from {founderName}{offer.employmentType ? ` · ${offer.employmentType}` : ""}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 text-sm">
          <div className="grid grid-cols-2 gap-2">
            <InfoBox label="Start date" value={fmtDate(offer.startDate)} />
            <InfoBox label="Work location" value={offer.workLocation || "—"} />
            <InfoBox label="Probation" value={offer.probationDays ? `${offer.probationDays} days` : "None"} />
            <InfoBox label="Reporting to" value={offer.reportingTo || "—"} />
          </div>

          {offer.responsibilities ? (
            <div>
              <p className="mb-1 text-xs font-medium text-muted-foreground">Key responsibilities</p>
              <p className="text-sm leading-relaxed">{offer.responsibilities}</p>
            </div>
          ) : null}

          <div className="rounded-lg border bg-muted/30 p-3">
            <p className="mb-2 text-xs font-medium text-muted-foreground">Compensation</p>
            {salary && <Row k="Base salary" v={`${salary}/month`} />}
            {tier1?.completionMin != null && salary && (
              <p className="mt-1 text-xs text-muted-foreground">Guaranteed at {tier1.completionMin}%+ task completion.</p>
            )}
            {offer.equityPercent ? (
              <Row k="Equity" v={`${offer.equityPercent}% · ${offer.vestingMonths}mo vest, ${offer.cliffMonths}mo cliff`} />
            ) : null}
            {!salary && !offer.equityPercent ? <p className="text-xs text-muted-foreground">Compensation model: {offer.compensationModel || "not specified"}</p> : null}
          </div>

          {(offer.performanceTiers || []).some((t) => t.monthlyCash > 0 || t.bonusAmount > 0) ? (
            <div>
              <p className="mb-1.5 text-xs font-medium text-muted-foreground">Performance tiers (informational — your base pay is guaranteed)</p>
              <div className="flex flex-col gap-1">
                {offer.performanceTiers.map((t) => (
                  <div key={t.tierNumber} className="flex items-center justify-between rounded-md bg-muted/40 px-2.5 py-1.5 text-xs">
                    <span>{t.label} ({t.completionMin}{t.completionMax != null ? `–${t.completionMax}` : "+"}%)</span>
                    <span className="font-medium">{t.monthlyCash > 0 ? `${offer.currency} ${Number(t.monthlyCash).toLocaleString()}` : "—"}{t.bonusAmount > 0 ? ` +${Number(t.bonusAmount).toLocaleString()}` : ""}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {enabledKpis.length > 0 ? (
            <div>
              <p className="mb-1.5 text-xs font-medium text-muted-foreground">What's being tracked</p>
              <ul className="flex flex-col gap-1">
                {enabledKpis.map((k) => (
                  <li key={k.name} className="flex items-center justify-between text-xs">
                    <span>{k.name}</span>
                    <span className="text-muted-foreground">{k.target}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {offer.message ? (
            <div className="rounded-lg border p-3">
              <p className="mb-1 text-xs font-medium text-muted-foreground">Message from {founderName}</p>
              <p className="text-sm italic">"{offer.message}"</p>
            </div>
          ) : null}

          {offer.expiresAt ? (
            <p className="text-xs text-muted-foreground">This offer expires {fmtDate(offer.expiresAt)}.</p>
          ) : null}

          {isPending ? (
            <div className="flex gap-2 border-t pt-3">
              <Button variant="outline" className="flex-1" disabled={responding} onClick={() => onRespond(offer, "declined")}>
                <X className="mr-1.5 h-4 w-4" /> Decline
              </Button>
              <Button className="flex-1" disabled={responding} onClick={() => onRespond(offer, "accepted")}>
                {responding ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Check className="mr-1.5 h-4 w-4" />}
                Accept offer
              </Button>
            </div>
          ) : (
            <div className="rounded-lg bg-muted/40 p-3 text-center text-xs text-muted-foreground">
              {offer.status === "accepted" ? "You've accepted this offer." : "This offer is no longer awaiting a response."}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function InfoBox({ label, value }) {
  return (
    <div className="rounded-md bg-muted/30 p-2">
      <p className="text-[10px] text-muted-foreground">{label}</p>
      <p className="truncate text-xs font-medium">{value}</p>
    </div>
  );
}
function Row({ k, v }) {
  return (
    <div className="flex items-center justify-between py-0.5 text-sm">
      <span className="text-muted-foreground">{k}</span>
      <span className="font-medium">{v}</span>
    </div>
  );
}

export default function TalentOffersPage({ user, onUpdateUser, onNavigate }) {
  const currentUserId = String(user?._id ?? user?.id ?? "");
  const [loading, setLoading] = useState(true);
  const [offers, setOffers] = useState([]);
  const [activeOffer, setActiveOffer] = useState(null);
  const [responding, setResponding] = useState(false);

  useEffect(() => {
    if (!currentUserId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const data = await offersApi.getReceivedOffers(currentUserId);
        if (!cancelled) setOffers(Array.isArray(data) ? data : []);
      } catch (error) {
        if (!cancelled) toast.error(error?.message || "Could not load your offers.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [currentUserId]);

  const { pending, resolved } = useMemo(() => {
    const p = offers.filter((o) => o.status === "pending");
    const r = offers.filter((o) => o.status !== "pending");
    return { pending: p, resolved: r };
  }, [offers]);

  const handleRespond = async (offer, status) => {
    setResponding(true);
    try {
      const updated = await offersApi.updateOfferStatus(offer._id, status);
      setOffers((prev) => prev.map((o) => (o._id === offer._id ? { ...o, ...updated } : o)));

      if (status === "accepted") {
        toast.success("Offer accepted — you're now part of the team!");
        setActiveOffer(null);
        // Role/founderId/startupId all changed server-side — refetch the
        // canonical user rather than guessing the new shape locally.
        try {
          const freshUser = await authApi.me();
          onUpdateUser?.(freshUser, { skipRemoteSync: true });
        } catch (err) {
          console.error("[TalentOffersPage] Failed to refresh user after acceptance:", err.message);
        }
        onNavigate?.("startup-office");
      } else {
        toast.success("Offer declined.");
        setActiveOffer(null);
      }
    } catch (error) {
      toast.error(error?.message || "Could not update the offer.");
    } finally {
      setResponding(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 p-6">
      <div>
        <h1 className="text-xl font-medium">Your offers</h1>
        <p className="text-sm text-muted-foreground">Real compensation offers founders have sent you.</p>
      </div>

      {offers.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
            <InboxIcon className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm font-medium">No offers yet</p>
            <p className="text-xs text-muted-foreground">When a founder sends you a compensation offer, it'll show up here.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {pending.length > 0 && (
            <div className="flex flex-col gap-3">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Awaiting your response</p>
              {pending.map((o) => <OfferCard key={o._id} offer={o} onOpen={setActiveOffer} />)}
            </div>
          )}
          {resolved.length > 0 && (
            <div className="flex flex-col gap-3">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Past offers</p>
              {resolved.map((o) => <OfferCard key={o._id} offer={o} onOpen={setActiveOffer} />)}
            </div>
          )}
        </>
      )}

      <OfferDetailDialog
        offer={activeOffer}
        open={Boolean(activeOffer)}
        onClose={() => setActiveOffer(null)}
        onRespond={handleRespond}
        responding={responding}
      />
    </div>
  );
}
