import React from "react";
import { Button } from "../ui/button";
import { cn } from "../ui/utils";
import {
  Home,
  LayoutGrid,
  BarChart3,
  Target,
  FileText,
  Calendar,
  Settings,
  LogOut,
  X,
} from "lucide-react";
const navSections = [
  {
    label: "MONITOR",
    items: [
      {
        id: "home",
        label: "Home",
        icon: Home,
      },
      {
        id: "portfolio",
        label: "Portfolio",
        icon: LayoutGrid,
      },
      {
        id: "analytics",
        label: "Analytics",
        icon: BarChart3,
      },
    ],
  },
  {
    label: "PROGRAM",
    items: [
      {
        id: "milestones",
        label: "Milestones",
        icon: Target,
      },
      {
        id: "deliverables",
        label: "Deliverables",
        icon: FileText,
      },
      {
        id: "calendar",
        label: "Calendar",
        icon: Calendar,
      },
    ],
  },
];
export default function OrganizationSidebar({
  currentView,
  onViewChange,
  cohortStats,
  isOpen = true,
  onClose,
  onLogout,
}) {
  const activeCount = cohortStats?.activeStartups || 0;
  const totalCount = cohortStats?.totalStartups || 0;
  return (
    <>
      {isOpen && onClose && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onClose}
        />
      )}
      <aside
        className={cn(
          "fixed left-0 top-0 h-full w-64 bg-background border-r border-border z-50 flex flex-col transition-transform duration-200",
          "md:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {onClose && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-2 top-2 h-8 w-8 p-0 md:hidden"
            onClick={onClose}
          >
            <X className="w-4 h-4" />
          </Button>
        )}
        <div className="px-6 py-5 border-b border-border">
          <h1 className="text-2xl font-bold text-primary">StartupVerse</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Organization Dashboard
          </p>
        </div>
        <div className="flex-1 overflow-y-auto py-6 px-4">
          {navSections.map((section) => (
            <div key={section.label} className="mb-6">
              <h3 className="px-3 mb-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {section.label}
              </h3>
              <div className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentView === item.id;
                  return (
                    <Button
                      key={item.id}
                      variant={isActive ? "secondary" : "ghost"}
                      className={cn(
                        "w-full justify-start h-11 px-3 text-sm font-medium transition-colors",
                        isActive &&
                          "bg-primary/10 text-primary hover:bg-primary/15",
                      )}
                      onClick={() => onViewChange(item.id)}
                    >
                      <Icon className="w-5 h-5 mr-3" />
                      {item.label}
                    </Button>
                  );
                })}
              </div>
            </div>
          ))}
          <div className="mb-6">
            <h3 className="px-3 mb-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              ENGAGEMENT
            </h3>
            <div className="mx-3 px-4 py-5 bg-muted/30 rounded-lg border border-border">
              <div className="flex justify-between items-center">
                <div className="text-center flex-1">
                  <div className="text-2xl font-bold text-primary">
                    {activeCount}
                  </div>
                  <div className="text-xs text-muted-foreground uppercase mt-1.5 font-medium">
                    Active
                  </div>
                </div>
                <div className="w-px h-14 bg-border mx-3" />
                <div className="text-center flex-1">
                  <div className="text-2xl font-bold">{totalCount}</div>
                  <div className="text-xs text-muted-foreground uppercase mt-1.5 font-medium">
                    Total
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="border-t border-border p-4 space-y-1">
          <Button
            variant="ghost"
            className="w-full justify-start h-11 px-3 text-sm font-medium"
            onClick={() => onViewChange("settings")}
          >
            <Settings className="w-5 h-5 mr-3" />
            Settings
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start h-11 px-3 text-sm font-medium text-muted-foreground hover:text-destructive"
            onClick={onLogout}
          >
            <LogOut className="w-5 h-5 mr-3" />
            Logout
          </Button>
        </div>
      </aside>
      <div className="hidden md:block w-64 flex-shrink-0" />
    </>
  );
}
