import { success as apiSuccess } from "./apiResponse.js";

const DEFAULT_LIMIT = 25;
const MAX_LIMIT = 100;

/** Escape user input before embedding in a RegExp. */
export function escapeRegex(value) {
  return String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Parse standard list query params from an Express request.
 *
 * @param {import('express').Request} req
 * @param {{
 *   defaultLimit?: number,
 *   maxLimit?: number,
 *   defaultSortBy?: string,
 *   allowedSortFields?: string[],
 *   defaultSortOrder?: 'asc' | 'desc',
 *   extraFilterKeys?: string[],
 * }} options
 */
export function parseListQuery(req, options = {}) {
  const {
    defaultLimit = DEFAULT_LIMIT,
    maxLimit = MAX_LIMIT,
    defaultSortBy = "createdAt",
    allowedSortFields = ["createdAt"],
    defaultSortOrder = "desc",
    extraFilterKeys = [],
  } = options;

  const q = String(req.query?.q || "").trim();

  const limitRaw = Number.parseInt(req.query?.limit, 10);
  const limit = Math.min(
    maxLimit,
    Math.max(1, Number.isFinite(limitRaw) ? limitRaw : defaultLimit),
  );

  const skipRaw = Number.parseInt(req.query?.skip, 10);
  const skip = Math.max(0, Number.isFinite(skipRaw) ? skipRaw : 0);

  const status = String(req.query?.status || "").trim().toLowerCase();

  const requestedSortBy = String(req.query?.sortBy || "").trim();
  const sortBy = allowedSortFields.includes(requestedSortBy)
    ? requestedSortBy
    : defaultSortBy;

  const orderRaw = String(req.query?.sortOrder || defaultSortOrder).toLowerCase();
  const sortOrder = orderRaw === "asc" ? 1 : -1;
  const sort = { [sortBy]: sortOrder };

  const extraFilters = {};
  for (const key of extraFilterKeys) {
    const raw = req.query?.[key];
    if (raw !== undefined && raw !== null && String(raw).trim() !== "") {
      extraFilters[key] = String(raw).trim();
    }
  }

  return { q, limit, skip, sort, sortBy, sortOrder: orderRaw === "asc" ? "asc" : "desc", status, extraFilters };
}

/** Case-insensitive regex `$or` across string fields. */
export function buildSearchFilter(q, fields = []) {
  const term = String(q || "").trim();
  if (!term || !fields.length) return null;
  const regex = new RegExp(escapeRegex(term), "i");
  return {
    $or: fields.map((field) => ({ [field]: regex })),
  };
}

/** MongoDB `$text` search when a text index exists on the model. */
export function buildTextSearchFilter(q) {
  const term = String(q || "").trim();
  if (!term) return null;
  return { $text: { $search: term } };
}

/** Merge base filter with optional search clauses. */
export function mergeFilters(baseFilter, ...clauses) {
  const parts = [baseFilter, ...clauses].filter(
    (c) => c && typeof c === "object" && Object.keys(c).length > 0,
  );
  if (parts.length === 0) return {};
  if (parts.length === 1) return parts[0];
  return { $and: parts };
}

/**
 * Standard paginated list response envelope (Step 3.1).
 */
export function paginatedSuccess(res, items, total, { limit, skip }, status = 200) {
  return apiSuccess(
    res,
    {
      items,
      total,
      limit,
      skip,
    },
    status,
  );
}

/**
 * Generic Mongoose list with count + page slice.
 *
 * @template T
 */
export async function listDocuments(
  Model,
  {
    baseFilter = {},
    listOptions,
    searchFilter = null,
    mapRow = (row) => row,
    lean = true,
  },
) {
  const { limit, skip, sort } = listOptions;
  const filter = mergeFilters(baseFilter, searchFilter);

  const [total, rows] = await Promise.all([
    Model.countDocuments(filter),
    Model.find(filter).sort(sort).skip(skip).limit(limit).lean(lean),
  ]);

  return {
    items: rows.map(mapRow),
    total,
  };
}

/**
 * Try `$text` search; on failure (no index), fall back to regex fields.
 */
export async function listDocumentsWithSearch(
  Model,
  {
    baseFilter = {},
    listOptions,
    textSearch = false,
    regexFields = [],
    mapRow = (row) => row,
    lean = true,
  },
) {
  const { q, limit, skip, sort } = listOptions;

  if (!q) {
    return listDocuments(Model, { baseFilter, listOptions, mapRow, lean });
  }

  if (textSearch) {
    try {
      const textFilter = mergeFilters(baseFilter, buildTextSearchFilter(q));
      const [total, rows] = await Promise.all([
        Model.countDocuments(textFilter),
        Model.find(textFilter).sort(sort).skip(skip).limit(limit).lean(lean),
      ]);
      return { items: rows.map(mapRow), total };
    } catch {
      // Missing text index in dev — fall through to regex.
    }
  }

  const regexFilter = buildSearchFilter(q, regexFields);
  return listDocuments(Model, {
    baseFilter,
    listOptions,
    searchFilter: regexFilter,
    mapRow,
    lean,
  });
}
