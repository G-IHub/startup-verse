import React, { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Button } from "../ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Badge } from "../ui/badge";
import { Separator } from "../ui/separator";
import {
  Shield,
  Bug,
  Database,
  Bell,
  Users,
  Settings,
  Activity,
  FileText,
  Zap,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
} from "lucide-react";
import { OutcomeDebugPanel } from "../debug/OutcomeDebugPanel";
import NotificationDebugPanel from "../NotificationDebugPanel";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";

/**
 * Admin Dashboard
 *
 * Centralized admin panel for platform developers.
 * Only accessible to users with isAdmin flag.
 */
export default function AdminDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");

  // Redirect if not admin
  if (!user?.isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md">
          <CardHeader>
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="w-6 h-6" />
              <CardTitle>Access Denied</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              You don't have permission to access the admin dashboard.
            </p>
            <Button
              onClick={() => (window.location.href = "/")}
              className="mt-4 w-full"
            >
              Return to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-purple-50 dark:bg-purple-950/20">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  window.location.href = "/";
                }}
                className="gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Back to Dashboard</span>
              </Button>
              <Separator orientation="vertical" className="h-8" />
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">Admin Dashboard</h1>
                  <p className="text-sm text-muted-foreground">
                    Platform development & debugging tools
                  </p>
                </div>
              </div>
            </div>
            <Badge
              variant="outline"
              className="gap-2 bg-purple-100 dark:bg-purple-900/40 border-purple-300 dark:border-purple-700"
            >
              <Shield className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span className="text-purple-700 dark:text-purple-300 font-semibold">
                {"Admin: "}
                {user.name}
              </span>
            </Badge>
          </div>
        </div>
      </div>
      <div className="container mx-auto px-4 py-8">
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <TabsList className="grid w-full grid-cols-6 lg:w-auto lg:inline-grid">
            <TabsTrigger value="overview" className="gap-2">
              <Activity className="w-4 h-4" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="outcomes" className="gap-2">
              <Bug className="w-4 h-4" />
              <span className="hidden sm:inline">Outcomes</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-2">
              <Bell className="w-4 h-4" />
              <span className="hidden sm:inline">Notifications</span>
            </TabsTrigger>
            <TabsTrigger value="database" className="gap-2">
              <Database className="w-4 h-4" />
              <span className="hidden sm:inline">Database</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="gap-2">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Users</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2">
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Settings</span>
            </TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Bug className="w-4 h-4 text-orange-600" />
                    Debug Tools
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">5</div>
                  <p className="text-xs text-muted-foreground">Active panels</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Bell className="w-4 h-4 text-blue-600" />
                    Notifications
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">-</div>
                  <p className="text-xs text-muted-foreground">System status</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Database className="w-4 h-4 text-green-600" />
                    Database
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    <CheckCircle2 className="w-6 h-6 text-green-600" />
                  </div>
                  <p className="text-xs text-muted-foreground">Connected</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Users className="w-4 h-4 text-purple-600" />
                    Admin Users
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">1</div>
                  <p className="text-xs text-muted-foreground">
                    Platform admins
                  </p>
                </CardContent>
              </Card>
            </div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-yellow-600" />
                  Quick Actions
                </CardTitle>
                <CardDescription>Common admin tasks</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                <Button
                  variant="outline"
                  className="justify-start gap-2"
                  onClick={() => setActiveTab("outcomes")}
                >
                  <Bug className="w-4 h-4" />
                  Debug Outcomes
                </Button>
                <Button
                  variant="outline"
                  className="justify-start gap-2"
                  onClick={() => setActiveTab("notifications")}
                >
                  <Bell className="w-4 h-4" />
                  Test Notifications
                </Button>
                <Button
                  variant="outline"
                  className="justify-start gap-2"
                  onClick={() => setActiveTab("database")}
                >
                  <Database className="w-4 h-4" />
                  View Database
                </Button>
                <Button
                  variant="outline"
                  className="justify-start gap-2"
                  onClick={() =>
                    window.open("/test-admin-system.html", "_blank")
                  }
                >
                  <FileText className="w-4 h-4" />
                  Test Admin System
                </Button>
                <Button
                  variant="outline"
                  className="justify-start gap-2"
                  onClick={() => {
                    console.log("Current user:", user);
                    console.log("LocalStorage:", localStorage);
                  }}
                >
                  <Activity className="w-4 h-4" />
                  Log Debug Info
                </Button>
                <Button
                  variant="outline"
                  className="justify-start gap-2"
                  onClick={() => setActiveTab("settings")}
                >
                  <Settings className="w-4 h-4" />
                  Admin Settings
                </Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-green-600" />
                  System Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Backend Connection</span>
                  <Badge
                    variant="outline"
                    className="gap-1 bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800"
                  >
                    <CheckCircle2 className="w-3 h-3 text-green-600" />
                    <span className="text-green-700 dark:text-green-300">
                      Connected
                    </span>
                  </Badge>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-sm">Auth System</span>
                  <Badge
                    variant="outline"
                    className="gap-1 bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800"
                  >
                    <CheckCircle2 className="w-3 h-3 text-green-600" />
                    <span className="text-green-700 dark:text-green-300">
                      Active
                    </span>
                  </Badge>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-sm">Debug Panels</span>
                  <Badge
                    variant="outline"
                    className="gap-1 bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800"
                  >
                    <CheckCircle2 className="w-3 h-3 text-green-600" />
                    <span className="text-green-700 dark:text-green-300">
                      Loaded
                    </span>
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="outcomes" className="space-y-6">
            <Alert>
              <Bug className="h-4 w-4" />
              <AlertTitle>Outcome & Task Debugger</AlertTitle>
              <AlertDescription>
                Diagnose and fix issues with weekly outcomes and task
                associations.
              </AlertDescription>
            </Alert>
            <OutcomeDebugPanel userId={user.id} visible={true} />
          </TabsContent>
          <TabsContent value="notifications" className="space-y-6">
            <Alert>
              <Bell className="h-4 w-4" />
              <AlertTitle>Notification Debugger</AlertTitle>
              <AlertDescription>
                Create test notifications and debug the notification system.
              </AlertDescription>
            </Alert>
            <NotificationDebugPanel />
          </TabsContent>
          <TabsContent value="database" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="w-5 h-5" />
                  Database Inspector
                </CardTitle>
                <CardDescription>
                  View and manage localStorage data
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      const keys = Object.keys(localStorage);
                      console.log("LocalStorage Keys:", keys);
                      console.log("Total Items:", keys.length);
                      keys.forEach((key) => {
                        console.log(`${key}:`, localStorage.getItem(key));
                      });
                    }}
                  >
                    Log All Data
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      const data = {
                        user: localStorage.getItem("startupverse_user"),
                        tasks: Object.keys(localStorage).filter((k) =>
                          k.startsWith("tasks_"),
                        ),
                        outcomes: Object.keys(localStorage).filter(
                          (k) =>
                            k.startsWith("outcomes_") || k.includes("Outcome"),
                        ),
                        notifications: Object.keys(localStorage).filter((k) =>
                          k.includes("notification"),
                        ),
                      };
                      console.log("Organized Data:", data);
                    }}
                  >
                    Log Organized Data
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      const dataStr = JSON.stringify(localStorage, null, 2);
                      const blob = new Blob([dataStr], {
                        type: "application/json",
                      });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = `startupverse-backup-${Date.now()}.json`;
                      a.click();
                    }}
                  >
                    Export Backup
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => {
                      if (
                        confirm(
                          "Clear ALL localStorage data? This cannot be undone!",
                        )
                      ) {
                        localStorage.clear();
                        alert("All data cleared. Page will reload.");
                        window.location.reload();
                      }
                    }}
                  >
                    Clear All Data
                  </Button>
                </div>
                <Separator />
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold">Quick Stats</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="p-2 bg-muted rounded">
                      <div className="text-xs text-muted-foreground">
                        Total Keys
                      </div>
                      <div className="font-semibold">
                        {Object.keys(localStorage).length}
                      </div>
                    </div>
                    <div className="p-2 bg-muted rounded">
                      <div className="text-xs text-muted-foreground">
                        Storage Used
                      </div>
                      <div className="font-semibold">
                        {(JSON.stringify(localStorage).length / 1024).toFixed(
                          2,
                        )}
                        {" KB"}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Admin Users
                </CardTitle>
                <CardDescription>
                  Manage platform administrators
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                        <Shield className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div>
                        <div className="font-semibold">{user.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {user.email}
                        </div>
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className="bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800"
                    >
                      <span className="text-purple-700 dark:text-purple-300">
                        Platform Admin
                      </span>
                    </Badge>
                  </div>
                </div>
                <Separator />
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Add More Admins</AlertTitle>
                  <AlertDescription>
                    {"To add more admin users, edit "}
                    <code className="bg-muted px-1 py-0.5 rounded">
                      /utils/adminHelpers.ts
                    </code>
                    {" and add their email to the "}
                    <code className="bg-muted px-1 py-0.5 rounded">
                      ADMIN_EMAILS
                    </code>
                    {" array."}
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Admin Settings
                </CardTitle>
                <CardDescription>
                  Configure admin panel preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Show Admin Badge</div>
                      <div className="text-sm text-muted-foreground">
                        Display admin indicator in bottom-left corner
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className="bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800"
                    >
                      <span className="text-green-700 dark:text-green-300">
                        Enabled
                      </span>
                    </Badge>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Debug Panels on Pages</div>
                      <div className="text-sm text-muted-foreground">
                        Show debug panels on regular pages (now deprecated)
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className="bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800"
                    >
                      <span className="text-orange-700 dark:text-orange-300">
                        Use Admin Page
                      </span>
                    </Badge>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Console Logging</div>
                      <div className="text-sm text-muted-foreground">
                        Verbose debug logging to browser console
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className="bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800"
                    >
                      <span className="text-green-700 dark:text-green-300">
                        Enabled
                      </span>
                    </Badge>
                  </div>
                </div>
                <Separator />
                <Alert>
                  <FileText className="h-4 w-4" />
                  <AlertTitle>Documentation</AlertTitle>
                  <AlertDescription className="space-y-2">
                    <p>Full admin system documentation:</p>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      <li>
                        <code>/ADMIN_SYSTEM_GUIDE.md</code>
                        {" - Complete guide"}
                      </li>
                      <li>
                        <code>/ADMIN_QUICK_REFERENCE.md</code>
                        {" - Quick reference"}
                      </li>
                      <li>
                        <code>/ADMIN_IMPLEMENTATION_CHECKLIST.md</code>
                        {" - Checklist"}
                      </li>
                      <li>
                        <code>/test-admin-system.html</code>
                        {" - Test page"}
                      </li>
                    </ul>
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
