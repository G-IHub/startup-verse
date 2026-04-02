import React from "react";
import { Badge } from "../ui/badge";
import { Shield, Settings } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";

/**
 * AdminBadge Component
 *
 * Displays a subtle badge indicating admin access.
 * Only visible to users with isAdmin flag.
 */
export function AdminBadge() {
  const { user } = useAuth();

  // Only show for admins
  if (!user?.isAdmin) return null;
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild={true}>
          <Badge
            variant="outline"
            className="gap-1.5 bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/40 cursor-help"
          >
            <Shield className="w-3 h-3" />
            <span className="text-xs font-medium">Admin</span>
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-xs space-y-1">
            <p className="font-semibold">Platform Admin Access</p>
            <p className="text-muted-foreground">
              You have access to debug panels and development tools
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * AdminDebugIndicator Component
 *
 * Fixed position indicator in bottom-left corner.
 * Shows admin status and provides navigation to admin dashboard.
 */
export function AdminDebugIndicator() {
  const { user } = useAuth();
  const [isExpanded, setIsExpanded] = React.useState(false);

  // Only show for admins
  if (!user?.isAdmin) return null;
  return (
    <div className="fixed bottom-4 left-4 z-50">
      <TooltipProvider>
        <Tooltip open={isExpanded} onOpenChange={setIsExpanded}>
          <TooltipTrigger asChild={true}>
            <button
              className="flex items-center gap-2 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-full shadow-lg transition-all duration-200 hover:scale-105"
              onClick={() => {
                // Navigate to admin dashboard
                window.location.href = "/?admin=true";
              }}
            >
              <Settings className="w-4 h-4 animate-spin-slow" />
              <span className="text-xs font-semibold">Admin Mode</span>
            </button>
          </TooltipTrigger>
          <TooltipContent side="right" className="max-w-xs">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-purple-500" />
                <p className="font-semibold text-sm">Platform Admin</p>
              </div>
              <div className="text-xs text-muted-foreground space-y-1">
                <p>
                  {"👤 "}
                  <strong>{user.name}</strong>
                </p>
                <p>
                  {"📧 "}
                  {user.email}
                </p>
                <div className="pt-2 border-t border-border mt-2">
                  <p className="font-medium text-foreground">
                    Click to open Admin Dashboard
                  </p>
                  <p className="text-muted-foreground mt-1">
                    Access debug tools, database inspector, and more
                  </p>
                </div>
              </div>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}
