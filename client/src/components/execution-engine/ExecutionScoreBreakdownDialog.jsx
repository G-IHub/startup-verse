/**
 * Execution score breakdown modal — matches WeeklyReviewModal / org Dialog styling.
 */
import React, { useState } from "react";
import { toast } from "sonner";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { BrandProgress } from "../organizations/_primitives";
import { TrendingUp, Zap, Share2, Copy, Check } from "lucide-react";

const METRICS = [
  { key: "weeklyCompletion", label: "Weekly Completion", weight: "40%" },
  { key: "outcomeQuality", label: "Outcome Quality", weight: "30%" },
  { key: "consistency", label: "Consistency", weight: "20%" },
  { key: "progression", label: "Progression", weight: "10%" },
];

function BreakdownRow({ label, weight, value }) {
  const safeValue = Number.isFinite(value) ? Math.min(100, Math.max(0, value)) : 0;
  return (
    <div className="rounded-input border border-surface-border bg-surface-page p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="font-body text-[13px] font-medium text-text-heading">{label}</p>
          <p className="font-body text-[11px] text-text-muted">{weight} of score</p>
        </div>
        <span className="shrink-0 font-body text-[13px] font-semibold text-primary">
          {safeValue}/100
        </span>
      </div>
      <BrandProgress value={safeValue} className="h-2" />
    </div>
  );
}

function percentileLabel(percentile) {
  if (percentile >= 90) return "Top 10% among founders";
  if (percentile >= 75) return "Top 25% among founders";
  if (percentile >= 50) return "Top 50% among founders";
  return "Building momentum — keep executing";
}

function generateShareText(scoreData) {
  const percentileText =
    scoreData.percentile >= 90
      ? "Top 10%"
      : scoreData.percentile >= 75
        ? "Top 25%"
        : scoreData.percentile >= 50
          ? "Top 50%"
          : "Building momentum";
  const changeText =
    scoreData.weeklyChange > 0 ? `📈 +${scoreData.weeklyChange} this week` : "";
  return `🚀 Execution Score: ${scoreData.score}/100 ${changeText}
${percentileText} among founders in the 12-Week Execution Challenge

Proving execution beats ideas. Join the challenge:
https://startupverse.com/12-week-challenge

#BuildInPublic #FounderJourney #StartupExecution #12WeekChallenge`;
}

export default function ExecutionScoreBreakdownDialog({ open, onOpenChange, scoreData }) {
  const [showShareOptions, setShowShareOptions] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  const handleOpenChange = (next) => {
    onOpenChange(next);
    if (!next) {
      setShowShareOptions(false);
      setCopySuccess(false);
    }
  };

  const handleShare = async (platform) => {
    if (!scoreData) return;
    const shareText = generateShareText(scoreData);
    const url = "https://startupverse.com/12-week-challenge";
    if (platform === "twitter") {
      window.open(
        `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`,
        "_blank",
      );
    } else if (platform === "linkedin") {
      window.open(
        `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
        "_blank",
      );
      navigator.clipboard.writeText(shareText);
      toast.success("Share text copied! Paste it in your LinkedIn post");
    } else if (platform === "copy") {
      navigator.clipboard.writeText(shareText);
      setCopySuccess(true);
      toast.success("Share text copied to clipboard!");
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  if (!scoreData) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="flex max-h-[min(90vh,640px)] w-full max-w-[calc(100%-2rem)] flex-col gap-0 overflow-hidden rounded-[16px] border border-primary/18 bg-white p-0 shadow-modal sm:max-w-md">
        <DialogDescription className="sr-only">
          Breakdown of your execution score across weekly completion, outcome quality,
          consistency, and progression.
        </DialogDescription>

        <DialogHeader className="shrink-0 space-y-1 border-b border-primary/12 bg-[#fafbff] px-5 py-4 text-left">
          <div className="flex items-start gap-3 pr-8">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/[0.09] text-primary">
              <Zap className="h-5 w-5 text-status-warning" aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <DialogTitle className="font-heading text-[17px] font-bold text-text-heading">
                Execution Score Breakdown
              </DialogTitle>
              <p className="font-body text-[13px] text-text-body">
                How your overall score is calculated
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          <section className="rounded-card bg-[linear-gradient(135deg,#3a5afe_0%,#7c4dff_100%)] px-5 py-6 text-center shadow-[0_4px_24px_rgba(58,90,254,0.18)]">
            <p className="font-body text-[11px] font-semibold uppercase tracking-[0.08em] text-white/70">
              Overall execution
            </p>
            <div className="mt-1 flex items-baseline justify-center gap-1">
              <span className="font-heading text-5xl font-extrabold text-white">
                {scoreData.score}
              </span>
              <span className="font-body text-lg font-medium text-white/60">/100</span>
            </div>
            {scoreData.weeklyChange !== 0 && (
              <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 font-body text-[12px] font-medium text-white">
                {scoreData.weeklyChange > 0 ? (
                  <TrendingUp className="h-3.5 w-3.5" />
                ) : (
                  <TrendingUp className="h-3.5 w-3.5 rotate-180" />
                )}
                {scoreData.weeklyChange > 0 ? "+" : ""}
                {scoreData.weeklyChange} this week
              </div>
            )}
            {typeof scoreData.percentile === "number" && (
              <p className="mt-3 font-body text-[12px] text-white/80">
                {percentileLabel(scoreData.percentile)}
              </p>
            )}
          </section>

          <div className="mt-4 space-y-2.5">
            {METRICS.map((metric) => (
              <BreakdownRow
                key={metric.key}
                label={metric.label}
                weight={metric.weight}
                value={scoreData.breakdown?.[metric.key]}
              />
            ))}
          </div>
        </div>

        <div className="shrink-0 space-y-2 border-t border-primary/12 bg-[#fafbff] px-5 py-4">
          {!showShareOptions ? (
            <>
              <Button
                type="button"
                className="h-10 w-full rounded-input bg-primary font-body text-[13px] font-semibold text-white shadow-[0_4px_16px_rgba(58,90,254,0.25)] hover:bg-primary-hover"
                onClick={() => setShowShareOptions(true)}
              >
                <Share2 className="mr-2 h-4 w-4" />
                Share My Progress
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-10 w-full rounded-input border border-surface-border bg-white font-body text-[13px] font-medium text-text-body hover:border-primary hover:text-primary"
                onClick={() => handleOpenChange(false)}
              >
                Close
              </Button>
            </>
          ) : (
            <>
              <p className="font-body text-[12px] font-medium text-text-muted">
                Share your progress
              </p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="h-10 flex-1 rounded-input border border-surface-border bg-white font-body text-[13px] font-medium hover:border-primary hover:text-primary"
                  onClick={() => handleShare("twitter")}
                >
                  <svg
                    className="mr-2 h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    aria-hidden
                  >
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                  X
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="h-10 flex-1 rounded-input border border-surface-border bg-white font-body text-[13px] font-medium hover:border-primary hover:text-primary"
                  onClick={() => handleShare("linkedin")}
                >
                  <svg
                    className="mr-2 h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    aria-hidden
                  >
                    <path d="M20.5 2h-17A1.5 1.5 0 002 3.5v17A1.5 1.5 0 003.5 22h17a1.5 1.5 0 001.5-1.5v-17A1.5 1.5 0 0020.5 2zM8 19H5v-9h3zM6.5 8.25A1.75 1.75 0 118.3 6.5a1.78 1.78 0 01-1.8 1.75zM19 19h-3v-4.74c0-1.42-.6-1.93-1.38-1.93A1.74 1.74 0 0013 14.19a.66.66 0 000 .14V19h-3v-9h2.9v1.3a3.11 3.11 0 012.7-1.4c1.55 0 3.36.86 3.36 3.66z" />
                  </svg>
                  LinkedIn
                </Button>
              </div>
              <Button
                type="button"
                variant="outline"
                className="h-10 w-full rounded-input border border-surface-border bg-white font-body text-[13px] font-medium hover:border-primary hover:text-primary"
                onClick={() => handleShare("copy")}
              >
                {copySuccess ? (
                  <>
                    <Check className="mr-2 h-4 w-4 text-status-success" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="mr-2 h-4 w-4" />
                    Copy share text
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="h-9 w-full font-body text-[13px] font-medium text-text-muted hover:text-primary"
                onClick={() => setShowShareOptions(false)}
              >
                Back to breakdown
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
