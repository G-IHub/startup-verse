import React, { useState, useEffect } from "react";
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
import { Input } from "../ui/input";
import {
  Shield,
  Bug,
  Database,
  Bell,
  Users,
  Settings,
  Activity,
  BarChart3,
  FileText,
  AlertCircle,
  ArrowLeft,
  TrendingUp,
  Rocket,
  Target,
  Search,
  Mail,
  RefreshCw,
  UserCheck,
  Award,
} from "lucide-react";
import { OutcomeDebugPanel } from "../debug/OutcomeDebugPanel";
import NotificationDebugPanel from "../NotificationDebugPanel";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  getPlatformAnalytics,
  getUserGrowthData,
  getOutcomeCompletionTrend,
  getTopPerformers,
  getAllUsers,
  searchUsers,
} from "../../utils/adminAnalytics";
const COLORS = [
  "#3A5AFE",
  "#2ECC71",
  "#F39C12",
  "#E74C3C",
  "#9B59B6",
  "#1ABC9C",
];

/**
 * Real-Time Admin Dashboard with Analytics
 */
export default function AdminDashboardRealTime() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [analytics, setAnalytics] = useState(null);
  const [growthData, setGrowthData] = useState([]);
  const [completionTrend, setCompletionTrend] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [topPerformers, setTopPerformers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Load analytics data
  const loadAnalytics = async () => {
    setIsLoading(true);
    console.log("🔄 [Admin Dashboard] Loading analytics...");
    try {
      const [analyticsData, growth, trend, users, top] = await Promise.all([
        getPlatformAnalytics(),
        getUserGrowthData(),
        getOutcomeCompletionTrend(),
        getAllUsers(),
        getTopPerformers(10),
      ]);
      console.log("✅ [Admin Dashboard] Analytics loaded successfully");
      console.log("📊 [Admin Dashboard] Analytics data:", analyticsData);
      console.log("👥 [Admin Dashboard] Users loaded:", users.length);
      console.log("🏆 [Admin Dashboard] Top performers:", top.length);
      setAnalytics(analyticsData);
      setGrowthData(growth);
      setCompletionTrend(trend);
      setAllUsers(users);
      setFilteredUsers(users);
      setTopPerformers(top);
    } catch (error) {
      console.error("❌ [Admin Dashboard] Failed to load analytics:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Load data on mount
  useEffect(() => {
    loadAnalytics();
  }, []);

  // Handle search
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredUsers(allUsers);
    } else {
      searchUsers(searchQuery).then(setFilteredUsers);
    }
  }, [searchQuery, allUsers]);

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

  // Prepare region chart data
  const regionData = analytics
    ? Object.entries(analytics.users.byRegion).map(([name, value]) => ({
        name,
        value,
      }))
    : [];

  // Prepare stage chart data
  const stageData = analytics
    ? Object.entries(analytics.startups.byStage).map(([name, value]) => ({
        name,
        value,
      }))
    : [];

  // Prepare industry chart data
  const industryData = analytics
    ? Object.entries(analytics.startups.byIndustry).map(([name, value]) => ({
        name,
        value,
      }))
    : [];
  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-purple-50 dark:bg-purple-950/20">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => (window.location.href = "/")}
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
                    Real-time platform analytics & tools
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={loadAnalytics}
                disabled={isLoading}
                className="gap-2"
              >
                <RefreshCw
                  className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`}
                />
                <span className="hidden sm:inline">Refresh</span>
              </Button>
              <Badge
                variant="outline"
                className="gap-2 bg-purple-100 dark:bg-purple-900/40 border-purple-300 dark:border-purple-700"
              >
                <Shield className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <span className="text-purple-700 dark:text-purple-300 font-semibold">
                  {user.name}
                </span>
              </Badge>
            </div>
          </div>
        </div>
      </div>
      <div className="container mx-auto px-4 py-8">
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <TabsList className="grid w-full grid-cols-7 lg:w-auto lg:inline-grid">
            <TabsTrigger value="overview" className="gap-2">
              <Activity className="w-4 h-4" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-2">
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">Analytics</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="gap-2">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Users</span>
            </TabsTrigger>
            <TabsTrigger value="startups" className="gap-2">
              <Rocket className="w-4 h-4" />
              <span className="hidden sm:inline">Startups</span>
            </TabsTrigger>
            <TabsTrigger value="outcomes" className="gap-2">
              <Bug className="w-4 h-4" />
              <span className="hidden sm:inline">Debug</span>
            </TabsTrigger>
            <TabsTrigger value="database" className="gap-2">
              <Database className="w-4 h-4" />
              <span className="hidden sm:inline">Database</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2">
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Settings</span>
            </TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="space-y-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <Users className="w-4 h-4 text-blue-600" />
                        Total Users
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">
                        {analytics?.users.total || 0}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        <span className="text-green-600 font-semibold">
                          +{analytics?.users.newThisWeek || 0}
                        </span>
                        {" this week"}
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <Rocket className="w-4 h-4 text-purple-600" />
                        Startups
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">
                        {analytics?.startups.total || 0}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {analytics?.users.founders || 0}
                        {" founders"}
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <Target className="w-4 h-4 text-green-600" />
                        Outcomes
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">
                        {analytics?.outcomes.total || 0}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        <span className="text-green-600 font-semibold">
                          {analytics?.outcomes.completionRate || 0}%
                        </span>
                        {" completed"}
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <Activity className="w-4 h-4 text-orange-600" />
                        Active Users
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">
                        {analytics?.engagement.weeklyActiveUsers || 0}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        This week
                      </p>
                    </CardContent>
                  </Card>
                </div>
                <Card>
                  <CardHeader>
                    <CardTitle>User Distribution</CardTitle>
                    <CardDescription>Users by role</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Rocket className="w-5 h-5 text-blue-600" />
                          <span className="font-semibold text-blue-900 dark:text-blue-100">
                            Founders
                          </span>
                        </div>
                        <div className="text-3xl font-bold text-blue-600">
                          {analytics?.users.founders || 0}
                        </div>
                        <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                          {analytics?.users.total
                            ? Math.round(
                                (analytics.users.founders /
                                  analytics.users.total) *
                                  100,
                              )
                            : 0}
                          % of users
                        </p>
                      </div>
                      <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <UserCheck className="w-5 h-5 text-green-600" />
                          <span className="font-semibold text-green-900 dark:text-green-100">
                            Team Members
                          </span>
                        </div>
                        <div className="text-3xl font-bold text-green-600">
                          {analytics?.users.teamMembers || 0}
                        </div>
                        <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                          {analytics?.users.total
                            ? Math.round(
                                (analytics.users.teamMembers /
                                  analytics.users.total) *
                                  100,
                              )
                            : 0}
                          % of users
                        </p>
                      </div>
                      <div className="p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Award className="w-5 h-5 text-purple-600" />
                          <span className="font-semibold text-purple-900 dark:text-purple-100">
                            Talent
                          </span>
                        </div>
                        <div className="text-3xl font-bold text-purple-600">
                          {analytics?.users.talent || 0}
                        </div>
                        <p className="text-sm text-purple-700 dark:text-purple-300 mt-1">
                          {analytics?.users.total
                            ? Math.round(
                                (analytics.users.talent /
                                  analytics.users.total) *
                                  100,
                              )
                            : 0}
                          % of users
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-green-600" />
                      Top Performers
                    </CardTitle>
                    <CardDescription>
                      Users with most completed outcomes
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {topPerformers.slice(0, 5).map((performer, index) => (
                        <div
                          key={performer.id}
                          className="flex items-center justify-between p-3 bg-muted rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                              <span className="text-sm font-bold text-primary">
                                #{index + 1}
                              </span>
                            </div>
                            <div>
                              <div className="font-semibold">
                                {performer.name}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {performer.email}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-green-600">
                              {performer.completedOutcomes || 0}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              outcomes
                            </div>
                          </div>
                        </div>
                      ))}
                      {topPerformers.length === 0 && (
                        <p className="text-center text-muted-foreground py-4">
                          No data available
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>
          <TabsContent value="analytics" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  User Growth (Last 30 Days)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={growthData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      tick={{
                        fontSize: 12,
                      }}
                    />
                    <YAxis />
                    <RechartsTooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="users"
                      stroke="#3A5AFE"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Outcome Completion Rate (Last 8 Weeks)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={completionTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="week" />
                    <YAxis />
                    <RechartsTooltip />
                    <Legend />
                    <Bar
                      dataKey="rate"
                      fill="#2ECC71"
                      name="Completion Rate (%)"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Startups by Stage</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={stageData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={(entry) => entry.name}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {stageData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <RechartsTooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    Startups by Industry
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={industryData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={(entry) => entry.name}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {industryData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <RechartsTooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>All Users</CardTitle>
                    <CardDescription>
                      {filteredUsers.length}
                      {" total users"}
                    </CardDescription>
                  </div>
                  <div className="w-64">
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search users..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-8"
                      />
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {filteredUsers.map((u) => (
                    <div
                      key={u.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <span className="text-sm font-semibold text-primary">
                            {u.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <div className="font-semibold">{u.name}</div>
                          <div className="text-sm text-muted-foreground flex items-center gap-2">
                            <Mail className="w-3 h-3" />
                            {u.email}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right text-sm">
                          <div className="font-semibold">
                            {u.completedOutcomes || 0}
                            {" outcomes"}
                          </div>
                          <div className="text-muted-foreground">
                            {u.completedTasks || 0}
                            {" tasks"}
                          </div>
                        </div>
                        <Badge variant="outline">
                          {u.role === "founder"
                            ? "🚀 Founder"
                            : u.role === "team-member"
                              ? "👥 Team"
                              : "⭐ Talent"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                  {filteredUsers.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">
                      No users found
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="startups" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">
                    Total Startups
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {analytics?.startups.total || 0}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">
                    Avg Team Size
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {analytics?.startups.averageTeamSize || 0}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">
                    Active Founders
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {analytics?.users.founders || 0}
                  </div>
                </CardContent>
              </Card>
            </div>
            <Card>
              <CardHeader>
                <CardTitle>Startup Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">By Stage</h4>
                  <div className="space-y-2">
                    {Object.entries(analytics?.startups.byStage || {}).map(
                      ([stage, count]) => (
                        <div
                          key={stage}
                          className="flex items-center justify-between p-2 bg-muted rounded"
                        >
                          <span>{stage}</span>
                          <Badge>{count}</Badge>
                        </div>
                      ),
                    )}
                  </div>
                </div>
                <Separator />
                <div>
                  <h4 className="font-semibold mb-2">By Industry</h4>
                  <div className="space-y-2">
                    {Object.entries(analytics?.startups.byIndustry || {}).map(
                      ([industry, count]) => (
                        <div
                          key={industry}
                          className="flex items-center justify-between p-2 bg-muted rounded"
                        >
                          <span>{industry}</span>
                          <Badge>{count}</Badge>
                        </div>
                      ),
                    )}
                  </div>
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
            <Separator className="my-6" />
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
                  <Button variant="outline" onClick={loadAnalytics}>
                    Refresh Analytics
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
                <Alert>
                  <FileText className="h-4 w-4" />
                  <AlertTitle>Documentation</AlertTitle>
                  <AlertDescription className="space-y-2">
                    <p>Full admin system documentation:</p>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      <li>
                        <code>/ADMIN_DASHBOARD_COMPLETE.md</code>
                        {" - Complete guide"}
                      </li>
                      <li>
                        <code>/HOW_TO_USE_ADMIN.md</code>
                        {" - Quick start"}
                      </li>
                      <li>
                        <code>/utils/adminHelpers.ts</code>
                        {" - Add admin emails here"}
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
