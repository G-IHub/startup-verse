import React from "react";
import { Building2, Map, MessageCircle, Users } from "lucide-react";
import { cn } from "../../ui/utils";

const ACTIONS = [
  {
    id: "office",
    label: "Office",
    description: "Run the virtual workspace",
    icon: Building2,
    page: "startup-office",
  },
  {
    id: "browse",
    label: "Browse Talent",
    description: "Find co-founders & hires",
    icon: Users,
    page: "team-matching",
  },
  {
    id: "chat",
    label: "Chat",
    description: "Team conversations",
    icon: MessageCircle,
    page: "founder-chat",
  },
  {
    id: "journey",
    label: "Journey",
    description: "6-stage roadmap",
    icon: Map,
    page: "journey",
  },
];

/**
 * Product-loop shortcuts so home depicts Launch → Execute → Build team.
 */
export default function FounderQuickActions({ onNavigate }) {
  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {ACTIONS.map((action) => {
        const Icon = action.icon;
        return (
          <button
            key={action.id}
            type="button"
            onClick={() => onNavigate?.(action.page)}
            className={cn(
              "flex items-center gap-3 rounded-card border-0 bg-white p-4 text-left shadow-soft",
              "transition-shadow duration-200 ease-in-out hover:shadow-[0_4px_24px_rgba(58,90,254,0.12)]",
            )}
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-input bg-primary-tint text-primary">
              <Icon className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="font-heading text-[14px] font-semibold text-text-heading">
                {action.label}
              </p>
              <p className="mt-0.5 font-body text-[12px] text-text-muted">
                {action.description}
              </p>
            </div>
          </button>
        );
      })}
    </section>
  );
}
