import React, { useEffect, useMemo, useState } from "react";
import { Sparkles } from "lucide-react";
import ExtraWorkLogDialog from "../../team-member/ExtraWorkLogDialog";
import * as founderApi from "../../../utils/api/founderApi";
import { resolveUserAvatar } from "../../../utils/resolveMediaUrl";

const PANEL =
  "rounded-card border border-surface-border bg-surface-card shadow-soft";

function groupByAuthor(logs) {
  const groups = new Map();
  for (const log of logs) {
    const key = String(log.authorId || "");
    if (!key) continue;
    const existing = groups.get(key) || {
      authorId: key,
      authorName: log.authorName || "Team member",
      authorAvatar: log.authorAvatar || "",
      logs: [],
    };
    existing.logs.push(log);
    groups.set(key, existing);
  }
  return [...groups.values()].sort((a, b) => b.logs.length - a.logs.length);
}

export default function FounderExtraWorkCard({ founderId }) {
  const [logs, setLogs] = useState([]);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    if (!founderId) return undefined;
    let cancelled = false;
    founderApi
      .getFounderWorkLogs(founderId)
      .then((rows) => {
        if (!cancelled) setLogs(Array.isArray(rows) ? rows : []);
      })
      .catch(() => {
        if (!cancelled) setLogs([]);
      });
    return () => {
      cancelled = true;
    };
  }, [founderId]);

  const groups = useMemo(() => groupByAuthor(logs), [logs]);

  return (
    <div className={PANEL}>
      <div className="space-y-3 px-4 py-4 sm:px-5">
        <div>
          <p className="font-body text-[11px] font-medium uppercase tracking-[0.08em] text-text-muted">
            Today
          </p>
          <h2 className="mt-1 font-heading text-[18px] font-semibold text-text-heading">
            Team extra work
          </h2>
          <p className="mt-1 font-body text-[13px] text-text-muted">
            Unassigned work your team logged at the end of the day.
          </p>
        </div>

        {groups.length === 0 ? (
          <div className="rounded-input bg-surface-page px-4 py-8 text-center">
            <Sparkles className="mx-auto h-5 w-5 text-text-muted" />
            <p className="mt-2 font-body text-[13px] text-text-muted">
              No extra work logged today.
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {groups.map((group) => {
              const avatar = resolveUserAvatar({
                avatarUrl: group.authorAvatar,
              });
              return (
                <li
                  key={group.authorId}
                  className="rounded-input bg-surface-page p-3"
                >
                  <div className="mb-2 flex items-center gap-2">
                    {avatar ? (
                      <img
                        src={avatar}
                        alt=""
                        className="h-8 w-8 shrink-0 rounded-full object-cover"
                      />
                    ) : (
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-tint font-heading text-[12px] font-bold text-primary">
                        {(group.authorName || "?").slice(0, 1).toUpperCase()}
                      </span>
                    )}
                    <span className="min-w-0 flex-1 truncate font-heading text-[13px] font-semibold text-text-heading">
                      {group.authorName}
                    </span>
                    <span className="rounded-pill bg-primary-tint px-2 py-0.5 font-body text-[11px] font-semibold text-primary">
                      {group.logs.length}
                    </span>
                  </div>
                  <ul className="space-y-1">
                    {group.logs.map((log) => (
                      <li key={log.id}>
                        <button
                          type="button"
                          onClick={() => setSelected(log)}
                          className="w-full rounded-input px-2 py-1.5 text-left font-body text-[12px] text-text-body transition-colors hover:bg-primary-tint/50 hover:text-text-heading"
                        >
                          {log.title}
                        </button>
                      </li>
                    ))}
                  </ul>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <ExtraWorkLogDialog
        open={Boolean(selected)}
        mode="view"
        initialLog={selected}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
      />
    </div>
  );
}
