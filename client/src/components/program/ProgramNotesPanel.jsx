import React, { useEffect, useState } from "react";
import { StickyNote } from "lucide-react";
import { toast } from "sonner";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import {
  ProgramEmptyState,
  ProgramPanelShell,
} from "./ProgramPanelShell";
import * as programApi from "../../utils/api/programApi";

export default function ProgramNotesPanel({ cohortId, memberships = [] }) {
  const [activeCohortId, setActiveCohortId] = useState(cohortId || "");
  const [notes, setNotes] = useState([]);
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setActiveCohortId(cohortId || "");
  }, [cohortId]);

  const resolvedCohortId = activeCohortId || cohortId;
  const programChoices = (memberships || [])
    .map((m) => ({
      id: String(m.cohortId || m.cohort?.id || ""),
      name: m.cohort?.name || "Program",
    }))
    .filter((row) => row.id);

  const load = async () => {
    if (!resolvedCohortId) {
      setNotes([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await programApi.listProgramNotes(resolvedCohortId, 1);
      setNotes(data.notes || []);
    } catch (err) {
      toast.error(err?.message || "Could not load notes.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [resolvedCohortId]);

  const post = async () => {
    const text = body.trim();
    if (!text || !resolvedCohortId) return;
    try {
      const created = await programApi.createProgramNote(resolvedCohortId, text);
      setNotes((prev) => [created, ...prev]);
      setBody("");
    } catch (err) {
      toast.error(err?.message || "Could not post note.");
    }
  };

  if (!resolvedCohortId) {
    return (
      <ProgramPanelShell
        icon={StickyNote}
        title="Notes"
        description="Shared notes for this program."
      >
        <ProgramEmptyState
          icon={StickyNote}
          title="Join a program first"
          description="Notes appear once your startup is enrolled."
        />
      </ProgramPanelShell>
    );
  }

  return (
    <ProgramPanelShell
      icon={StickyNote}
      title="Notes"
      description="One shared thread for this program. Org admins and enrolled startups can write here."
    >
      {programChoices.length > 1 ? (
        <label className="block font-body text-xs font-medium text-text-muted">
          Program
          <select
            className="mt-1 h-9 w-full rounded-input border border-surface-border bg-white px-3 font-body text-sm text-text-body"
            value={resolvedCohortId}
            onChange={(e) => setActiveCohortId(e.target.value)}
          >
            {programChoices.map((row) => (
              <option key={row.id} value={row.id}>
                {row.name}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      <Textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Write a note for everyone in this program"
        rows={3}
      />
      <Button className="mt-2" onClick={post} disabled={!body.trim()}>
        Post note
      </Button>
      <div className="mt-4 space-y-3">
        {loading ? (
          <p className="font-body text-sm text-text-muted">Loading notes…</p>
        ) : notes.length === 0 ? (
          <p className="font-body text-sm text-text-muted">No notes yet.</p>
        ) : (
          notes.map((note) => (
            <article
              key={note.id}
              className="rounded-input border border-surface-border/80 bg-surface-page/60 px-3 py-2"
            >
              <p className="font-body text-xs text-text-muted">
                {note.authorName || "Member"} ·{" "}
                {note.createdAt
                  ? new Date(note.createdAt).toLocaleString()
                  : ""}
              </p>
              <p className="mt-1 whitespace-pre-wrap font-body text-sm text-text-body">
                {note.body}
              </p>
            </article>
          ))
        )}
      </div>
    </ProgramPanelShell>
  );
}

