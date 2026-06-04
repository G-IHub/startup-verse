import { getPresenceLabel, formatLastSeen } from "../../domains/presence/presenceModel.js";

const SIZE_CLASSES = {
  sm: "h-1.5 w-1.5",
  md: "h-2.5 w-2.5",
  lg: "h-3 w-3",
};

/**
 * Connection dot + optional label for team roster surfaces.
 */
export default function PresenceIndicator({
  connection,
  isOnline,
  showLabel = false,
  size = "sm",
  statusText = "",
  lastSeenAt = null,
  className = "",
}) {
  const online =
    connection === "online" || (connection == null && Boolean(isOnline));
  const dotSize = SIZE_CLASSES[size] || SIZE_CLASSES.sm;
  const label =
    online && statusText
      ? statusText
      : getPresenceLabel({ isOnline: online, connection: online ? "online" : "offline" });
  const title = online ? label : formatLastSeen({ lastSeenAt }) || label;

  return (
    <div
      className={`flex items-center gap-1.5 ${className}`.trim()}
      title={title}
    >
      <span
        className={`inline-block shrink-0 rounded-full ${dotSize} ${
          online ? "bg-status-success" : "bg-text-muted/60"
        }`}
        aria-hidden
      />
      {showLabel ? (
        <p
          className={`truncate font-body text-[11px] font-medium ${
            online ? "text-text-body" : "text-text-muted"
          }`}
        >
          {label}
        </p>
      ) : null}
    </div>
  );
}
