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
import * as React from "react";
import * as VisuallyHiddenPrimitive from "@radix-ui/react-visually-hidden";
export const VisuallyHidden = React.forwardRef((props, ref) => (
  <VisuallyHiddenPrimitive.Root
    {..._extends(
      {
        ref: ref,
      },
      props,
    )}
  />
));
VisuallyHidden.displayName = "VisuallyHidden";
