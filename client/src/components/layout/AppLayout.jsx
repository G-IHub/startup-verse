import React, { useEffect } from "react";
import { Button } from "../ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Badge } from "../ui/badge";
import { toast } from "sonner";
import ThemeToggle from "../ThemeToggle";
import {
  Bell,
  Settings,
  LogOut,
  ChevronDown,
  MessageSquare,
  Users,
  Rocket,
  Briefcase,
  UsersRound,
  UserCheck,
  Map,
  Sparkles,
  Building,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
export default function AppLayout({
  user,
  children,
  onLogout,
  currentPage,
  onPageChange,
}) {
  // Load notification and message counts from localStorage
  const notifications = JSON.parse(
    localStorage.getItem("founder_notifications") || "[]",
  );
  const notificationCount = notifications.filter((n) => !n.read).length;
  const messageCount = 3; // TODO: Implement actual message count from messaging system

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Check for Cmd/Ctrl key
      if (e.metaKey || e.ctrlKey) {
        switch (e.key.toLowerCase()) {
          case "j":
            e.preventDefault();
            onPageChange("journey");
            toast.info("🗺️ Opening Startup Journey");
            break;
          case "f":
            e.preventDefault();
            onPageChange("team-matching");
            toast.info("👥 Opening Team Matching");
            break;
          case "h":
            e.preventDefault();
            onPageChange("startup-office");
            toast.info("🏢 Opening Virtual Office");
            break;
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onPageChange]);
  const switchRole = (newRole) => {
    // Get current user from localStorage to ensure we have the latest data
    const currentUser = localStorage.getItem("startupverse_user");
    if (!currentUser) {
      toast.error("User data not found");
      return;
    }
    const parsedUser = JSON.parse(currentUser);

    // Update user role while preserving all other data
    const updatedUser = {
      ...parsedUser,
      role: newRole,
      onboardingComplete: true, // Ensure onboarding is marked complete
    };
    localStorage.setItem("startupverse_user", JSON.stringify(updatedUser));
    const roleEmoji = {
      founder: "🚀",
      talent: "⭐",
      "team-member": "👥",
    };
    const roleName = {
      founder: "Founder",
      talent: "Talent",
      "team-member": "Team Member",
    };
    toast.success(`Switching to ${roleName[newRole]} view...`);

    // Force reload to update the entire app with new role
    setTimeout(() => window.location.reload(), 500);
  };

  // Get navigation tools based on role and team status
  const getNavigationTools = (role) => {
    const hasTeam = user.startupId; // Check if user has a team

    if (role === "founder") {
      return [
        {
          id: "startup-office",
          label: "Virtual Office",
          icon: Sparkles,
          shortcut: "⌘H",
          tooltip: "Your immersive workspace (⌘H)",
        },
        {
          id: "journey",
          label: "Journey",
          icon: Map,
          shortcut: "⌘J",
          tooltip: "6-stage startup roadmap (⌘J)",
        },
        {
          id: "team-matching",
          label: hasTeam ? "Team" : "Find Talent",
          icon: UsersRound,
          shortcut: "⌘F",
          tooltip: hasTeam
            ? "Manage your team (⌘F)"
            : "Find co-founders & teammates (⌘F)",
        },
      ];
    } else if (role === "team-member") {
      return [
        {
          id: "startup-office",
          label: "Virtual Office",
          icon: Sparkles,
          shortcut: "⌘H",
          tooltip: "Your immersive workspace (⌘H)",
        },
      ];
    } else if (role === "talent") {
      return [
        {
          id: "startup-office",
          label: "Virtual Office",
          icon: Sparkles,
          shortcut: "⌘H",
          tooltip: "Your workspace (⌘H)",
        },
        {
          id: "team-matching",
          label: "Find Startups",
          icon: UsersRound,
          shortcut: "⌘F",
          tooltip: "Discover opportunities (⌘F)",
        },
      ];
    }
    return [
      {
        id: "startup-office",
        label: "Virtual Office",
        icon: Sparkles,
        shortcut: "⌘H",
        tooltip: "Your workspace (⌘H)",
      },
    ];
  };
  const navigationTools = getNavigationTools(user.role);
  const getRoleIcon = (role) => {
    const icons = {
      founder: Rocket,
      "team-member": Users,
      talent: UsersRound,
      mentor: Users,
      investor: Users,
      freelancer: Briefcase,
    };
    return icons[role];
  };
  const RoleIcon = getRoleIcon(user.role);
  return (
    <div className="flex flex-col h-screen bg-background">
      <header className="bg-background/95 backdrop-blur-sm border-b border-border px-4 py-3 sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
              <RoleIcon className="w-5 h-5 text-white" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-base text-foreground">StartupVerse</h1>
              <p className="text-xs text-muted-foreground capitalize">
                {user.role.replace("-", " ")}
              </p>
            </div>
          </div>
          <TooltipProvider>
            <div className="flex items-center gap-1">
              {navigationTools.map((tool) => {
                const IconComponent = tool.icon;
                const isActive = currentPage === tool.id;
                return (
                  <Tooltip key={tool.id}>
                    <TooltipTrigger asChild={true}>
                      <Button
                        variant={isActive ? "default" : "ghost"}
                        size="sm"
                        onClick={() => onPageChange(tool.id)}
                        className={`h-9 px-3 ${isActive ? "shadow-md" : ""}`}
                      >
                        <IconComponent className="w-4 h-4" />
                        <span className="hidden md:inline ml-2 text-sm">
                          {tool.label}
                        </span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      <p className="text-xs">{tool.tooltip}</p>
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
          </TooltipProvider>
          <div className="flex-1" />
          <div className="flex items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild={true}>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 px-3 gap-2 hidden lg:flex border-accent/30 text-accent hover:bg-accent/10"
                    onClick={() => {
                      localStorage.setItem("startupverse_ui_mode", "hybrid");
                      toast.success("Switching to Adaptive Workspace mode...");
                      setTimeout(() => window.location.reload(), 500);
                    }}
                  >
                    <Building className="w-3 h-3" />
                    <span className="text-xs">Try Adaptive</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">
                    Switch to context-aware workspace (Option B Hybrid)
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <ThemeToggle
              variant="ghost"
              size="sm"
              className="bg-muted/80 hover:bg-accent/20 transition-colors"
            />
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild={true}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="relative h-8 w-8 p-0 rounded-full bg-muted/80 hover:bg-accent/20 transition-colors cursor-pointer"
                    onClick={() => onPageChange("messages")}
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    {messageCount > 0 && (
                      <Badge className="absolute -top-1 -right-1 w-4 h-4 text-[10px] flex items-center justify-center p-0">
                        {messageCount}
                      </Badge>
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">Messages (⌘M in Virtual Office)</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild={true}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="relative h-8 w-8 p-0 rounded-full bg-muted/80 hover:bg-accent/20 transition-colors cursor-pointer"
                  >
                    <Bell className="w-3.5 h-3.5" />
                    {notificationCount > 0 && (
                      <Badge className="absolute -top-1 -right-1 w-4 h-4 text-[10px] flex items-center justify-center p-0">
                        {notificationCount}
                      </Badge>
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">Notifications</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <DropdownMenu>
              <DropdownMenuTrigger asChild={true}>
                <Button variant="ghost" size="sm" className="h-9 px-2 gap-2">
                  <Avatar className="w-7 h-7">
                    <AvatarImage src={user.profile?.avatar} />
                    <AvatarFallback className="text-xs">
                      {user.name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <ChevronDown className="w-3 h-3 text-muted-foreground hidden sm:block" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel className="text-xs">
                  <div className="flex flex-col gap-1">
                    <span className="text-sm">{user.name}</span>
                    <span className="text-muted-foreground font-normal">
                      {user.email}
                    </span>
                    <Badge variant="outline" className="w-fit text-xs mt-1">
                      {user.role === "founder" && "🚀 Founder"}
                      {user.role === "talent" && "⭐ Talent"}
                      {user.role === "team-member" && "👥 Team Member"}
                    </Badge>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-xs text-muted-foreground">
                  ⌨️ Keyboard Shortcuts
                </DropdownMenuLabel>
                <div className="px-2 py-1 space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">
                      Virtual Office
                    </span>
                    <kbd className="px-2 py-0.5 rounded bg-muted text-xs">
                      ⌘H
                    </kbd>
                  </div>
                  {user.role === "founder" && (
                    <>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Journey</span>
                        <kbd className="px-2 py-0.5 rounded bg-muted text-xs">
                          ⌘J
                        </kbd>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">
                          Find Talent
                        </span>
                        <kbd className="px-2 py-0.5 rounded bg-muted text-xs">
                          ⌘F
                        </kbd>
                      </div>
                    </>
                  )}
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => onPageChange("settings")}
                  className="text-xs"
                >
                  <Settings className="w-3 h-3 mr-2" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-xs text-muted-foreground">
                  🔧 Dev Tools - Switch Role
                </DropdownMenuLabel>
                <DropdownMenuItem
                  onClick={() => switchRole("founder")}
                  className="text-xs"
                  disabled={user.role === "founder"}
                >
                  <Rocket className="w-3 h-3 mr-2" />
                  {"Founder "}
                  {user.role === "founder" && "✓"}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => switchRole("talent")}
                  className="text-xs"
                  disabled={user.role === "talent"}
                >
                  <Users className="w-3 h-3 mr-2" />
                  {"Talent "}
                  {user.role === "talent" && "✓"}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => switchRole("team-member")}
                  className="text-xs"
                  disabled={user.role === "team-member"}
                >
                  <UserCheck className="w-3 h-3 mr-2" />
                  {"Team Member "}
                  {user.role === "team-member" && "✓"}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={onLogout}
                  className="text-destructive text-xs"
                >
                  <LogOut className="w-3 h-3 mr-2" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
