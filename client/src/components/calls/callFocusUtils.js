export function isCallTextInputFocused() {
  const active = document.activeElement;
  if (!active || !(active instanceof HTMLElement)) return false;

  const tag = active.tagName.toLowerCase();
  if (tag === "input" || tag === "textarea" || tag === "select") return true;
  if (active.isContentEditable) return true;

  return Boolean(active.closest("[contenteditable='true']"));
}

export function hasBareKeyModifier(event) {
  return !event.ctrlKey && !event.metaKey && !event.altKey;
}
