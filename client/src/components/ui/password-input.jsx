import * as React from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "./utils";
import { inputSurfaceClassName } from "./input";

/**
 * Password field with show/hide toggle. Matches Input styling (including focus ring).
 */
const PasswordInput = React.forwardRef(
  ({ className, showToggle = true, ...props }, ref) => {
    const [visible, setVisible] = React.useState(false);
    return (
      <div className="relative w-full">
        <input
          ref={ref}
          type={visible ? "text" : "password"}
          data-slot="password-input"
          className={cn(
            inputSurfaceClassName,
            showToggle && "pr-10",
            className,
          )}
          {...props}
        />
        {showToggle ? (
          <button
            type="button"
            className={cn(
              "absolute right-1 top-1/2 -translate-y-1/2 rounded-md p-1.5",
              "text-muted-foreground hover:text-foreground",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
            )}
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? "Hide password" : "Show password"}
            aria-pressed={visible}
          >
            {visible ? (
              <EyeOff className="size-4 shrink-0" aria-hidden />
            ) : (
              <Eye className="size-4 shrink-0" aria-hidden />
            )}
          </button>
        ) : null}
      </div>
    );
  },
);
PasswordInput.displayName = "PasswordInput";

export { PasswordInput };
