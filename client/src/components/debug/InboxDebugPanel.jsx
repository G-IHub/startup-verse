import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Bug, RefreshCw, Check, X, AlertCircle } from "lucide-react";
import * as inboxApi from "../../utils/api/inboxApi";
export default function InboxDebugPanel({ userId, userEmail, role }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [debugData, setDebugData] = useState(null);
  const runDebug = async () => {
    setIsLoading(true);
    try {
      if (role === "founder") {
        const orgInvites = await inboxApi.getOrganizationInvitations(userId);
        const interests = await inboxApi.getReceivedInterests(userId);
        setDebugData({
          userId,
          userEmail,
          role,
          organizationInvitations: orgInvites,
          interestMessages: interests,
          timestamp: new Date().toISOString(),
        });
      } else {
        setDebugData({
          userId,
          userEmail,
          role,
          error: "Debug panel only available for founders",
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error) {
      setDebugData({
        userId,
        userEmail,
        role,
        error: error.message,
        timestamp: new Date().toISOString(),
      });
    } finally {
      setIsLoading(false);
    }
  };
  useEffect(() => {
    if (isOpen && !debugData) {
      runDebug();
    }
  }, [isOpen]);
  if (!isOpen) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-50 shadow-lg"
      >
        <Bug className="w-4 h-4 mr-2" />
        Debug Inbox
      </Button>
    );
  }
  return (
    <div className="fixed bottom-4 right-4 z-50 w-96 max-h-[80vh] overflow-auto shadow-2xl">
      <Card>
        <CardHeader className="pb-3 border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <Bug className="w-4 h-4 text-orange-600" />
              Inbox Debug Panel
            </CardTitle>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={runDebug}
                disabled={isLoading}
                className="h-7 px-2"
              >
                <RefreshCw
                  className={`w-3 h-3 ${isLoading ? "animate-spin" : ""}`}
                />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsOpen(false);
                  setDebugData(null);
                }}
                className="h-7 px-2"
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-3 space-y-3 text-xs">
          <div className="p-2 bg-muted/50 rounded border">
            <p className="font-semibold text-[10px] text-muted-foreground uppercase mb-1">
              User Info
            </p>
            <div className="space-y-1">
              <p>
                <span className="font-medium">Email:</span> {userEmail}
              </p>
              <p>
                <span className="font-medium">ID:</span>{" "}
                <code className="text-[10px]">{userId}</code>
              </p>
              <p>
                <span className="font-medium">Role:</span>{" "}
                <Badge variant="outline" className="text-[9px]">
                  {role}
                </Badge>
              </p>
            </div>
          </div>
          {debugData?.organizationInvitations && (
            <div className="p-2 bg-blue-50 rounded border border-blue-200">
              <div className="flex items-center justify-between mb-2">
                <p className="font-semibold text-[10px] text-blue-900 uppercase">
                  Organization Invitations
                </p>
                <Badge className="text-[9px]">
                  {debugData.organizationInvitations.length}
                </Badge>
              </div>
              {debugData.organizationInvitations.length === 0 ? (
                <p className="text-[10px] text-muted-foreground">
                  No invitations found
                </p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-auto">
                  {debugData.organizationInvitations.map((inv, idx) => (
                    <div
                      key={idx}
                      className="p-2 bg-white rounded border text-[10px]"
                    >
                      <div className="flex items-start justify-between mb-1">
                        <p className="font-medium">{inv.organizationName}</p>
                        <Badge
                          variant={
                            inv.status === "pending"
                              ? "default"
                              : inv.status === "accepted"
                                ? "outline"
                                : "secondary"
                          }
                          className="text-[8px]"
                        >
                          {inv.status}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground">{inv.cohortName}</p>
                      {inv.message && (
                        <p className="mt-1 text-muted-foreground line-clamp-2">
                          {inv.message}
                        </p>
                      )}
                      <p className="mt-1 text-[9px] text-muted-foreground">
                        {new Date(inv.sentAt || inv.createdAt).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          {debugData?.interestMessages && (
            <div className="p-2 bg-purple-50 rounded border border-purple-200">
              <div className="flex items-center justify-between mb-2">
                <p className="font-semibold text-[10px] text-purple-900 uppercase">
                  Interest Messages
                </p>
                <Badge className="text-[9px]">
                  {debugData.interestMessages.length}
                </Badge>
              </div>
              {debugData.interestMessages.length === 0 ? (
                <p className="text-[10px] text-muted-foreground">
                  No interest messages found
                </p>
              ) : (
                <p className="text-[10px]">
                  {debugData.interestMessages.length}
                  {" interest(s) from talent"}
                </p>
              )}
            </div>
          )}
          {debugData?.error && (
            <div className="p-2 bg-red-50 rounded border border-red-200">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-[10px] text-red-900 uppercase mb-1">
                    Error
                  </p>
                  <p className="text-[10px] text-red-700">
                    {debugData.error}
                  </p>
                </div>
              </div>
            </div>
          )}
          <div className="p-2 bg-green-50 rounded border border-green-200">
            <p className="font-semibold text-[10px] text-green-900 uppercase mb-2">
              Troubleshooting
            </p>
            <ul className="space-y-1 text-[10px] text-green-700">
              <li className="flex items-start gap-1">
                <Check className="w-3 h-3 mt-0.5 flex-shrink-0" />
                <span>
                  If you see invitations above, they should appear in your
                  Inbox's "Received" tab
                </span>
              </li>
              <li className="flex items-start gap-1">
                <Check className="w-3 h-3 mt-0.5 flex-shrink-0" />
                <span>
                  {
                    "Make sure the organization sent the invitation to this email: "
                  }
                  <strong>{userEmail}</strong>
                </span>
              </li>
              <li className="flex items-start gap-1">
                <Check className="w-3 h-3 mt-0.5 flex-shrink-0" />
                <span>
                  Try refreshing the page or clicking the refresh button above
                </span>
              </li>
              <li className="flex items-start gap-1">
                <Check className="w-3 h-3 mt-0.5 flex-shrink-0" />
                <span>
                  Organization invitations appear with a green briefcase icon
                </span>
              </li>
            </ul>
          </div>
          {debugData?.timestamp && (
            <p className="text-[9px] text-muted-foreground text-center">
              {"Last updated: "}
              {new Date(debugData.timestamp).toLocaleTimeString()}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
