import React, { useCallback, useEffect, useState } from "react";
import { Github, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "../ui/button";
import * as githubApi from "../../utils/api/githubApi";

export default function GitHubAccountConnect({ user }) {
  const [status, setStatus] = useState({ connected: false, configured: true, githubLogin: "" });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const next = await githubApi.getGithubConnection();
      setStatus(next);
    } catch (err) {
      toast.error(err?.message || "Could not load GitHub status.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  if (user?.role !== "founder") return null;

  const connect = async () => {
    setBusy(true);
    try {
      const data = await githubApi.getGithubAuthorizeUrl();
      const authUrl = data.authUrl;
      if (!authUrl) throw new Error("GitHub authorize URL missing.");
      const popup = window.open(
        authUrl,
        "GitHub OAuth",
        "width=600,height=700",
      );
      if (!popup) throw new Error("Allow popups to connect GitHub.");
      const timer = setInterval(() => {
        if (popup.closed) {
          clearInterval(timer);
          refresh().finally(() => setBusy(false));
        }
      }, 500);
    } catch (err) {
      toast.error(err?.message || "Could not start GitHub connect.");
      setBusy(false);
    }
  };

  const disconnect = async () => {
    setBusy(true);
    try {
      await githubApi.disconnectGithub();
      await refresh();
      toast.success("GitHub disconnected");
    } catch (err) {
      toast.error(err?.message || "Could not disconnect GitHub.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-input border border-surface-border bg-surface-page px-4 py-3">
      <div>
        <p className="flex items-center gap-2 font-body text-sm font-semibold text-text-heading">
          <Github className="h-4 w-4" aria-hidden />
          GitHub
        </p>
        <p className="mt-0.5 font-body text-xs text-text-muted">
          {loading
            ? "Checking…"
            : status.connected
              ? `Connected as ${status.githubLogin}`
              : status.configured
                ? "Import issues as tasks. Requests repo access."
                : "Ask an admin to set GitHub OAuth env vars."}
        </p>
      </div>
      {status.connected ? (
        <Button variant="outline" onClick={disconnect} disabled={busy}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Disconnect"}
        </Button>
      ) : (
        <Button onClick={connect} disabled={busy || !status.configured}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Connect GitHub"}
        </Button>
      )}
    </div>
  );
}
