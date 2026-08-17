import mongoose from "mongoose";
import WorkLog from "../models/WorkLog.js";
import User from "../models/User.js";
import TeamMemberProfile from "../models/TeamMemberProfile.js";
import Startup from "../models/Startup.js";
import { error as apiError, success as apiSuccess } from "../utils/apiResponse.js";
import { createNotification } from "../services/notificationService.js";

const TEAM_ROLES = new Set(["team-member", "team"]);

function isSameUtcDay(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  const now = new Date();
  return (
    date.getUTCFullYear() === now.getUTCFullYear() &&
    date.getUTCMonth() === now.getUTCMonth() &&
    date.getUTCDate() === now.getUTCDate()
  );
}

function parseRange(query) {
  const fromRaw = query?.from;
  const toRaw = query?.to;
  let from = fromRaw ? new Date(fromRaw) : null;
  let to = toRaw ? new Date(toRaw) : null;
  if (from && Number.isNaN(from.getTime())) from = null;
  if (to && Number.isNaN(to.getTime())) to = null;
  if (!from || !to) {
    const now = new Date();
    from = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    to = new Date(from.getTime() + 24 * 60 * 60 * 1000);
  }
  return { from, to };
}

function normalizeLinkUrl(raw) {
  const value = String(raw || "").trim();
  if (!value) return "";
  const candidate = /^https?:\/\//i.test(value) ? value : `https://${value}`;
  try {
    const parsed = new URL(candidate);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
    return parsed.toString().slice(0, 2000);
  } catch {
    return null;
  }
}

function normalizeImage(raw) {
  if (raw === null) return null;
  if (!raw || typeof raw !== "object") return undefined;
  const url = String(raw.url || "").trim();
  if (!url) return null;
  const allowed =
    /^https?:\/\//i.test(url) || url.startsWith("/uploads/");
  if (!allowed) return undefined;
  return {
    url: url.slice(0, 2000),
    name: String(raw.name || "").trim().slice(0, 300),
    mimeType: String(raw.mimeType || "").trim().slice(0, 200),
    size: Number.isFinite(Number(raw.size)) ? Number(raw.size) : 0,
  };
}

function mapWorkLogDto(doc, author = null) {
  const createdAt = doc.createdAt;
  return {
    id: String(doc._id),
    startupId: doc.startupId ? String(doc.startupId) : "",
    founderId: doc.founderId ? String(doc.founderId) : "",
    authorId: doc.authorId ? String(doc.authorId) : "",
    authorName: author?.name || "Team member",
    authorAvatar: author?.avatarUrl || "",
    title: doc.title,
    description: doc.description,
    image: doc.image
      ? {
          url: doc.image.url,
          name: doc.image.name || "",
          mimeType: doc.image.mimeType || "",
          size: doc.image.size || 0,
        }
      : null,
    linkUrl: doc.linkUrl || "",
    createdAt: createdAt,
    updatedAt: doc.updatedAt,
    editable: isSameUtcDay(createdAt),
  };
}

async function hydrateAuthors(logs) {
  const ids = [
    ...new Set(
      logs
        .map((row) => String(row.authorId || ""))
        .filter((id) => mongoose.Types.ObjectId.isValid(id)),
    ),
  ];
  if (ids.length === 0) return logs.map((row) => mapWorkLogDto(row));
  const users = await User.find(
    { _id: { $in: ids } },
    { name: 1, avatarUrl: 1 },
  ).lean();
  const byId = new Map(users.map((user) => [String(user._id), user]));
  return logs.map((row) => mapWorkLogDto(row, byId.get(String(row.authorId))));
}

async function resolveMemberContext(teamMemberId) {
  const user = await User.findById(teamMemberId, {
    name: 1,
    role: 1,
    founderId: 1,
    startupId: 1,
    avatarUrl: 1,
  }).lean();
  if (!user) return { error: "Team member not found.", status: 404 };

  const profile = await TeamMemberProfile.findOne({ userId: teamMemberId }).lean();
  const founderId = user.founderId || profile?.founderId || null;
  let startupId = user.startupId || profile?.startupId || null;

  if (!startupId && founderId) {
    const startup = await Startup.findOne({ founderId }, { _id: 1 }).lean();
    if (startup?._id) startupId = startup._id;
  }

  const role = String(user.role || "");
  if (!TEAM_ROLES.has(role) || !founderId || !startupId) {
    return {
      error: "You must belong to a startup to log extra work.",
      status: 403,
    };
  }

  return { user, founderId, startupId };
}

export async function createWorkLog(req, res) {
  const teamMemberId = req.params.teamMemberId;
  const context = await resolveMemberContext(teamMemberId);
  if (context.error) return apiError(res, context.error, context.status);

  const title = String(req.body?.title || "").trim();
  const description = String(req.body?.description || "").trim();
  if (title.length < 2) {
    return apiError(res, "Title is required.", 400);
  }
  if (description.length < 2) {
    return apiError(res, "Description is required.", 400);
  }

  const linkUrl = normalizeLinkUrl(req.body?.linkUrl);
  if (linkUrl === null) {
    return apiError(res, "Link must be a valid http or https URL.", 400);
  }

  const image = normalizeImage(req.body?.image);
  if (image === undefined) {
    return apiError(res, "Image must be an uploaded image URL.", 400);
  }

  const log = await WorkLog.create({
    startupId: context.startupId,
    founderId: context.founderId,
    authorId: teamMemberId,
    title,
    description,
    image: image || null,
    linkUrl,
  });

  const authorName = context.user?.name || "A team member";
  try {
    await createNotification({
      userId: context.founderId,
      type: "work-log",
      title: "Extra work logged",
      message: `${authorName} logged: ${title}`,
      actionUrl: "/home",
      metadata: {
        workLogId: String(log._id),
        teamMemberId: String(teamMemberId),
      },
    });
  } catch {
    // Log is saved even if the founder notification fails.
  }

  const [dto] = await hydrateAuthors([log.toObject()]);
  return apiSuccess(res, dto, 201);
}

export async function listMemberWorkLogs(req, res) {
  const teamMemberId = req.params.teamMemberId;
  const context = await resolveMemberContext(teamMemberId);
  if (context.error) return apiError(res, context.error, context.status);

  const { from, to } = parseRange(req.query);
  const logs = await WorkLog.find({
    authorId: teamMemberId,
    createdAt: { $gte: from, $lt: to },
  })
    .sort({ createdAt: -1 })
    .lean();

  return apiSuccess(res, await hydrateAuthors(logs));
}

export async function updateWorkLog(req, res) {
  const teamMemberId = req.params.teamMemberId;
  const log = await WorkLog.findOne({
    _id: req.params.workLogId,
    authorId: teamMemberId,
  });
  if (!log) return apiError(res, "Work log not found.", 404);
  if (!isSameUtcDay(log.createdAt)) {
    return apiError(res, "You can only edit extra work logged today.", 403);
  }

  if (req.body?.title !== undefined) {
    const title = String(req.body.title || "").trim();
    if (title.length < 2) return apiError(res, "Title is required.", 400);
    log.title = title;
  }
  if (req.body?.description !== undefined) {
    const description = String(req.body.description || "").trim();
    if (description.length < 2) {
      return apiError(res, "Description is required.", 400);
    }
    log.description = description;
  }
  if (req.body?.linkUrl !== undefined) {
    const linkUrl = normalizeLinkUrl(req.body.linkUrl);
    if (linkUrl === null) {
      return apiError(res, "Link must be a valid http or https URL.", 400);
    }
    log.linkUrl = linkUrl;
  }
  if (req.body?.image !== undefined) {
    const image = normalizeImage(req.body.image);
    if (image === undefined) {
      return apiError(res, "Image must be an uploaded image URL.", 400);
    }
    log.image = image;
  }

  await log.save();
  const [dto] = await hydrateAuthors([log.toObject()]);
  return apiSuccess(res, dto);
}

export async function deleteWorkLog(req, res) {
  const teamMemberId = req.params.teamMemberId;
  const log = await WorkLog.findOne({
    _id: req.params.workLogId,
    authorId: teamMemberId,
  });
  if (!log) return apiError(res, "Work log not found.", 404);
  if (!isSameUtcDay(log.createdAt)) {
    return apiError(res, "You can only delete extra work logged today.", 403);
  }
  await log.deleteOne();
  return apiSuccess(res, { id: String(log._id), deleted: true });
}

function founderGuard(req, founderId) {
  return req.user.isAdmin === true || req.user.id === String(founderId);
}

export async function listFounderWorkLogs(req, res) {
  const founderId = req.params.founderId;
  if (!founderGuard(req, founderId)) {
    return apiError(res, "Forbidden.", 403);
  }

  const { from, to } = parseRange(req.query);
  const logs = await WorkLog.find({
    founderId,
    createdAt: { $gte: from, $lt: to },
  })
    .sort({ createdAt: -1 })
    .lean();

  return apiSuccess(res, await hydrateAuthors(logs));
}
