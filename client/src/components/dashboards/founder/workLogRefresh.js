export const WORK_LOG_REFRESH_INTERVAL_MS = 30_000;

export function startWorkLogRefresh(
  refresh,
  {
    windowTarget = window,
    documentTarget = document,
    intervalMs = WORK_LOG_REFRESH_INTERVAL_MS,
  } = {},
) {
  const refreshWhenVisible = () => {
    if (documentTarget.visibilityState !== "hidden") refresh();
  };

  windowTarget.addEventListener("focus", refreshWhenVisible);
  documentTarget.addEventListener("visibilitychange", refreshWhenVisible);
  const intervalId = windowTarget.setInterval(refreshWhenVisible, intervalMs);

  return () => {
    windowTarget.removeEventListener("focus", refreshWhenVisible);
    documentTarget.removeEventListener("visibilitychange", refreshWhenVisible);
    windowTarget.clearInterval(intervalId);
  };
}
