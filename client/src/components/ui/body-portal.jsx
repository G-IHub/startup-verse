import { createPortal } from "react-dom";

/**
 * Mount overlays on document.body so they stack above a Radix Dialog
 * (portaled at z-50). Nested fixed overlays that stay in the page tree
 * paint behind that dialog because of the layout stacking context.
 */
export default function BodyPortal({ children }) {
  if (typeof document === "undefined") return null;
  return createPortal(children, document.body);
}
