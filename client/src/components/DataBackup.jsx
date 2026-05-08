import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import {
  Download,
  AlertCircle,
  CheckCircle2,
  Trash2,
  Database,
} from "lucide-react";
import { toast } from "sonner";
import { apiGet } from "../utils/apiClient.js";
import {
  wipeLegacyStartupVerseStorage,
  getBrowserKVStats,
} from "../utils/clearLegacyClientStorage.js";

export default function DataBackup({ user }) {
  const [showConfirmClear, setShowConfirmClear] = useState(false);
  const kvStats = getBrowserKVStats();

  const exportServerSnapshot = async () => {
    if (!user?.id) {
      toast.error("Sign in to export your server-backed data.");
      return;
    }
    try {
      const [journey, clientPreferences] = await Promise.all([
        apiGet(`/founders/${user.id}/journey`),
        apiGet(`/users/${user.id}/client-preferences`),
      ]);
      const payload = {
        exportDate: new Date().toISOString(),
        version: "3-server",
        appName: "StartupVerse",
        userId: user.id,
        journey,
        clientPreferences,
      };
      const dataStr = JSON.stringify(payload, null, 2);
      const dataBlob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `startupverse-server-backup-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success("Server snapshot exported.");
    } catch (e) {
      console.warn(e);
      toast.error("Export failed. Check that you are signed in.");
    }
  };

  const handleClearLegacyKeys = () => {
    wipeLegacyStartupVerseStorage();
    toast.success("Legacy browser keys removed. Refreshing…");
    setTimeout(() => window.location.reload(), 600);
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="mb-2">Data Backup</h2>
        <p className="text-muted-foreground">
          Founder journey and preferences are stored on the server. Export pulls
          those documents only.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-body-medium text-muted-foreground flex items-center gap-2">
              <Database className="w-4 h-4" />
              Legacy KV keys
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-display-small">{kvStats.keyCount}</p>
            <p className="text-caption-large text-muted-foreground mt-1">
              Leftover browser keys (optional cleanup)
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-body-medium text-muted-foreground flex items-center gap-2">
              <Database className="w-4 h-4" />
              KV footprint
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-display-small">
              {kvStats.approxKb}
              {" KB"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-body-medium text-muted-foreground flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Source of truth
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant="secondary">API</Badge>
            <p className="text-caption-large text-muted-foreground mt-2">
              Journey + client preferences
            </p>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="w-5 h-5 text-primary" />
            Export server snapshot
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            GET founder journey + client preferences as JSON
          </p>
        </CardHeader>
        <CardContent>
          <Button onClick={exportServerSnapshot} className="w-full" size="lg">
            <Download className="w-4 h-4 mr-2" />
            Download JSON
          </Button>
        </CardContent>
      </Card>
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <Trash2 className="w-5 h-5" />
            Danger zone
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Remove legacy StartupVerse keys from this browser only
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {!showConfirmClear ? (
            <>
              <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-muted-foreground">
                    This does not delete your account on the server. It clears
                    leftover prefixed keys so the client relies on cookies +
                    APIs.
                  </div>
                </div>
              </div>
              <Button
                onClick={() => setShowConfirmClear(true)}
                variant="destructive"
                className="w-full"
                size="lg"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Remove legacy browser keys
              </Button>
            </>
          ) : (
            <div className="space-y-3">
              <p className="text-center">Run cleanup?</p>
              <div className="flex gap-2">
                <Button
                  onClick={handleClearLegacyKeys}
                  variant="destructive"
                  className="flex-1"
                >
                  Yes, clean up
                </Button>
                <Button
                  onClick={() => setShowConfirmClear(false)}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
