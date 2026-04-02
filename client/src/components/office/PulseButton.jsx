function _extends() {
  return (
    (_extends = Object.assign
      ? Object.assign.bind()
      : function (n) {
          for (var e = 1; e < arguments.length; e++) {
            var t = arguments[e];
            for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]);
          }
          return n;
        }),
    _extends.apply(null, arguments)
  );
}
import React from "react";
import { motion } from "motion/react";
import { Button } from "../ui/button";
export function PulseButton({
  pulse = false,
  variant,
  size,
  children,
  ...props
}) {
  if (!pulse) {
    return (
      <Button
        {..._extends(
          {
            variant: variant,
            size: size,
          },
          props,
        )}
      >
        {children}
      </Button>
    );
  }
  return (
    <motion.div
      animate={{
        scale: [1, 1.02, 1],
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        repeatType: "loop",
      }}
      className="relative inline-flex"
    >
      <span className="absolute -inset-0.5 rounded-lg bg-blue-400 opacity-75 blur-sm animate-pulse" />
      <Button
        {..._extends(
          {
            variant: variant,
            size: size,
          },
          props,
          {
            className: `relative ${props.className}`,
          },
        )}
      >
        {children}
      </Button>
    </motion.div>
  );
}
