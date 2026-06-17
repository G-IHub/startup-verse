const MOBILE_BREAKPOINT = 768;
const MAX_VISIBLE_TILES = 12;

/**
 * @param {number} count
 * @param {{ width?: number, height?: number }} viewport
 */
export function getGridLayout(count, viewport = {}) {
  const safeCount = Math.max(0, Math.min(count, MAX_VISIBLE_TILES));
  const width = viewport.width ?? 1024;
  const isMobile = width < MOBILE_BREAKPOINT;

  if (safeCount <= 0) {
    return emptyLayout();
  }

  if (safeCount === 1) {
    return {
      ...baseLayout(safeCount),
      gridTemplateColumns: "1fr",
      gridTemplateRows: "1fr",
      justifyItems: "center",
      alignItems: "center",
      maxTileWidth: isMobile ? "100%" : "640px",
      tileSpans: [{ col: "1", row: "1" }],
    };
  }

  if (safeCount === 2) {
    return {
      ...baseLayout(safeCount),
      gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
      gridTemplateRows: isMobile ? "1fr 1fr" : "1fr",
      tileSpans: [
        { col: "1", row: "1" },
        { col: isMobile ? "1" : "2", row: isMobile ? "2" : "1" },
      ],
    };
  }

  if (safeCount === 3) {
    if (isMobile) {
      return {
        ...baseLayout(safeCount),
        gridTemplateColumns: "1fr 1fr",
        gridTemplateRows: "1fr 1fr",
        tileSpans: [
          { col: "1 / 3", row: "1" },
          { col: "1", row: "2" },
          { col: "2", row: "2" },
        ],
      };
    }

    return {
      ...baseLayout(safeCount),
      gridTemplateColumns: "2fr 1fr",
      gridTemplateRows: "1fr 1fr",
      tileSpans: [
        { col: "1", row: "1 / 3" },
        { col: "2", row: "1" },
        { col: "2", row: "2" },
      ],
    };
  }

  if (safeCount === 4) {
    return {
      ...baseLayout(safeCount),
      gridTemplateColumns: "1fr 1fr",
      gridTemplateRows: "1fr 1fr",
      tileSpans: defaultSpans(safeCount, 2, 2),
    };
  }

  if (safeCount <= 6) {
    const cols = isMobile ? 2 : 3;
    const rows = Math.ceil(safeCount / cols);
    return {
      ...baseLayout(safeCount),
      gridTemplateColumns: repeatFr(cols),
      gridTemplateRows: repeatFr(rows),
      tileSpans: defaultSpans(safeCount, cols, rows),
    };
  }

  if (safeCount <= 9) {
    const cols = isMobile ? 2 : 3;
    const rows = Math.ceil(safeCount / cols);
    return {
      ...baseLayout(safeCount),
      gridTemplateColumns: repeatFr(cols),
      gridTemplateRows: repeatFr(rows),
      scrollable: safeCount > 6,
      tileSpans: defaultSpans(safeCount, cols, rows),
    };
  }

  const cols = isMobile ? 2 : 3;
  const rows = Math.ceil(safeCount / cols);
  return {
    ...baseLayout(safeCount),
    gridTemplateColumns: repeatFr(cols),
    gridTemplateRows: repeatFr(rows),
    scrollable: true,
    tileSpans: defaultSpans(safeCount, cols, rows),
  };
}

function baseLayout(count) {
  return {
    count,
    maxTileWidth: null,
    scrollable: count > 9,
    justifyItems: "stretch",
    alignItems: "stretch",
  };
}

function emptyLayout() {
  return {
    count: 0,
    gridTemplateColumns: "1fr",
    gridTemplateRows: "1fr",
    tileSpans: [],
    maxTileWidth: null,
    scrollable: false,
    justifyItems: "center",
    alignItems: "center",
  };
}

function repeatFr(n) {
  return Array.from({ length: n }, () => "1fr").join(" ");
}

function defaultSpans(count, cols, rows) {
  const spans = [];
  for (let i = 0; i < count; i += 1) {
    const col = (i % cols) + 1;
    const row = Math.floor(i / cols) + 1;
    spans.push({ col: String(col), row: String(row) });
  }
  if (rows < 1) return spans;
  return spans;
}
