/**
 * SectionCard
 *
 * Primary content container for the org subtree. Wraps shadcn Card with the
 * dashboard-canonical surface (rounded-card, border-surface-border, bg-white,
 * shadow-soft, lift-on-hover).
 *
 * Composition:
 *   <SectionCard>
 *     <SectionCard.Header title="..." description="..." action={<...>} />
 *     <SectionCard.Body>...</SectionCard.Body>
 *   </SectionCard>
 *
 * Or use it as a generic card without sub-components — children will be
 * rendered directly inside the card surface.
 *
 * Reference: TeamMemberDashboard.jsx:308-329, FounderDashboard.jsx:1865-1882.
 */
import React from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "../../ui/card";
import { cn } from "../../ui/utils";

function SectionCard({ className, interactive = false, children, ...rest }) {
  return (
    <Card
      {...rest}
      className={cn(
        "rounded-card border-0 bg-white shadow-soft transition-shadow duration-200 ease-in-out",
        interactive &&
          "cursor-pointer hover:shadow-[0_4px_24px_rgba(58,90,254,0.14)]",
        className,
      )}
    >
      {children}
    </Card>
  );
}

function SectionCardHeader({
  title,
  description,
  action,
  className,
  children,
}) {
  return (
    <CardHeader className={cn("px-4 pt-4 sm:px-5", className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          {title && (
            <CardTitle className="font-heading text-[18px] font-semibold text-text-heading">
              {title}
            </CardTitle>
          )}
          {description && (
            <CardDescription className="mt-1 font-body text-[13px] font-normal text-text-body">
              {description}
            </CardDescription>
          )}
          {children}
        </div>
        {action && <div className="flex-shrink-0">{action}</div>}
      </div>
    </CardHeader>
  );
}

function SectionCardBody({ className, ...props }) {
  return (
    <CardContent
      className={cn("space-y-3 px-4 pb-4 pt-0 sm:px-5", className)}
      {...props}
    />
  );
}

SectionCard.Header = SectionCardHeader;
SectionCard.Body = SectionCardBody;

export default SectionCard;
