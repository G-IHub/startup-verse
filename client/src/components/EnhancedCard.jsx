import React from "react";
import { Card, CardContent } from "./ui/card";
export function EnhancedCard({
  title,
  value,
  change,
  positive,
  icon: Icon,
  className = "",
}) {
  return (
    <Card
      className={`relative overflow-hidden hover:shadow-lg hover:shadow-primary/5 transition-all ${className}`}
    >
      <div className="absolute top-0 right-0 w-20 h-20 opacity-10 bg-primary/30 rounded-bl-full" />
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Icon className="w-5 h-5 text-primary" />
          </div>
          {change && (
            <span
              className="text-xs px-2 py-1 rounded-md"
              style={{
                backgroundColor: positive
                  ? "rgba(16, 185, 129, 0.1)"
                  : "rgba(239, 68, 68, 0.1)",
                color: positive ? "#10B981" : "#EF4444",
              }}
            >
              {change}
            </span>
          )}
        </div>
        <div className="space-y-1">
          <div className="text-headline-small">{value}</div>
          <div className="text-body-medium text-muted-foreground">{title}</div>
        </div>
      </CardContent>
    </Card>
  );
}
export function FeatureCard({
  title,
  description,
  icon: Icon,
  gradient = "primary",
  className = "",
}) {
  const colors = {
    primary: {
      bg: "#3A5AFE",
      line: "#3A5AFE",
    },
    secondary: {
      bg: "#2ECC71",
      line: "#2ECC71",
    },
    success: {
      bg: "#10B981",
      line: "#10B981",
    },
  };
  const color = colors[gradient];
  return (
    <Card
      className={`relative overflow-hidden group hover:shadow-lg hover:shadow-primary/10 transition-all ${className}`}
    >
      <div
        className="absolute top-0 left-0 right-0 h-1"
        style={{
          background: color.line,
        }}
      />
      <CardContent className="p-6">
        <div
          className="w-12 h-12 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"
          style={{
            background: color.bg,
          }}
        >
          <Icon className="w-6 h-6 text-white" />
        </div>
        <h3 className="text-lg mb-2">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}
export function ActivityItem({ title, time, icon: Icon, type = "primary" }) {
  const colors = {
    primary: {
      bg: "rgba(99, 102, 241, 0.1)",
      border: "rgba(99, 102, 241, 0.3)",
      text: "#6366F1",
    },
    secondary: {
      bg: "rgba(139, 92, 246, 0.1)",
      border: "rgba(139, 92, 246, 0.3)",
      text: "#8B5CF6",
    },
    success: {
      bg: "rgba(16, 185, 129, 0.1)",
      border: "rgba(16, 185, 129, 0.3)",
      text: "#10B981",
    },
  };
  const color = colors[type];
  return (
    <div
      className="flex items-start gap-3 p-3 rounded-lg transition-all hover:scale-[1.02]"
      style={{
        backgroundColor: color.bg,
      }}
    >
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{
          backgroundColor: color.bg,
          border: `1px solid ${color.border}`,
        }}
      >
        <Icon
          className="w-4 h-4"
          style={{
            color: color.text,
          }}
        />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm">{title}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{time}</p>
      </div>
    </div>
  );
}
export function GradientButton({
  children,
  onClick,
  variant = "primary",
  size = "md",
  className = "",
}) {
  const colors = {
    primary: {
      bg: "#3A5AFE",
      shadow: "rgba(58, 90, 254, 0.25)",
    },
    secondary: {
      bg: "#2ECC71",
      shadow: "rgba(46, 204, 113, 0.25)",
    },
  };
  const color = colors[variant];
  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
  };
  return (
    <button
      onClick={onClick}
      className={`rounded-lg text-white transition-all hover:scale-105 hover:shadow-lg inline-flex items-center justify-center gap-2 ${sizes[size]} ${className}`}
      style={{
        background: color.bg,
        boxShadow: `0 4px 12px ${color.shadow}`,
      }}
    >
      {children}
    </button>
  );
}
