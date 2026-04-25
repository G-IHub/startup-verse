import { Router } from "express";
import { randomBytes } from "crypto";
import asyncHandler from "../utils/asyncHandler.js";
import requireAuth from "../middleware/requireAuth.js";
import Poll from "../models/Poll.js";
import Startup from "../models/Startup.js";
import User from "../models/User.js";
import { error as apiError, success as apiSuccess } from "../utils/apiResponse.js";
import { emitRealtime } from "../services/realtime.service.js";
import { SOCKET_EVENTS } from "../realtime/events.js";
import { startupRoom } from "../realtime/rooms.js";

const pollsRouter = Router();

async function resolveStartupScope(rawValue) {
  const value = String(rawValue || "").trim();
  if (!value) return null;
  const byId = await Startup.findById(value, { _id: 1, founderId: 1 }).catch(() => null);
  if (byId?._id) {
    return { canonicalId: String(byId._id), founderUserId: byId.founderId ? String(byId.founderId) : null };
  }
  const byFounder = await Startup.findOne({ founderId: value }, { _id: 1, founderId: 1 }).catch(() => null);
  if (byFounder?._id) {
    return { canonicalId: String(byFounder._id), founderUserId: byFounder.founderId ? String(byFounder.founderId) : null };
  }
  return null;
}

async function canAccessPolls(req, startupId) {
  const requested = await resolveStartupScope(startupId);
  if (!requested) return null;
  if (req.user?.isAdmin) return requested;
  const me = await User.findById(req.user.id, { startupId: 1, founderId: 1 });
  if (!me) return null;
  const candidates = [req.user.id, String(me.startupId || ""), String(me.founderId || "")].filter(Boolean);
  for (const c of candidates) {
    const scope = await resolveStartupScope(c);
    if (scope && scope.canonicalId === requested.canonicalId) return requested;
  }
  return null;
}

function isFounderOf(req, scope) {
  return req.user?.isAdmin || String(req.user?.id) === scope.founderUserId;
}

function mapPollDto(doc) {
  const row = doc?.toObject ? doc.toObject() : doc || {};
  const totalVotes = (row.options || []).reduce((s, o) => s + (o.votes?.length || 0), 0);
  return {
    id: String(row._id || ""),
    startupId: String(row.startupId || row.founderId || ""),
    question: String(row.question || ""),
    description: String(row.description || ""),
    options: (row.options || []).map((o) => ({
      id: String(o.id || ""),
      text: String(o.text || ""),
      votes: (o.votes || []).map(String),
      percentage: totalVotes > 0 ? Math.round((o.votes?.length || 0) / totalVotes * 100) : 0,
    })),
    allowMultiple: Boolean(row.allowMultiple),
    anonymous: Boolean(row.anonymous),
    endsAt: row.endsAt ? row.endsAt.toISOString() : null,
    status: String(row.status || "active"),
    totalVotes,
    createdBy: String(row.createdBy || ""),
    createdByName: String(row.createdByName || ""),
    createdAt: row.createdAt ? row.createdAt.toISOString() : new Date().toISOString(),
    updatedAt: row.updatedAt ? row.updatedAt.toISOString() : null,
  };
}

pollsRouter.get(
  "/startups/:startupId/polls",
  requireAuth,
  asyncHandler(async (req, res) => {
    const scope = await canAccessPolls(req, req.params.startupId);
    if (!scope) return apiError(res, "Forbidden.", 403);
    const rows = await Poll.find({
      $or: [{ startupId: scope.canonicalId }, { founderId: scope.founderUserId || scope.canonicalId }],
    }).sort({ createdAt: -1 });
    return apiSuccess(res, rows.map(mapPollDto));
  }),
);

pollsRouter.post(
  "/startups/:startupId/polls",
  requireAuth,
  asyncHandler(async (req, res) => {
    const scope = await canAccessPolls(req, req.params.startupId);
    if (!scope) return apiError(res, "Forbidden.", 403);
    if (!isFounderOf(req, scope)) return apiError(res, "Only founders can create polls.", 403);

    const { question, description, options, allowMultiple, anonymous, endsInDays } = req.body || {};
    if (!question?.trim()) return apiError(res, "question is required.", 400);
    const validOptions = (options || []).map((t) => String(t || "").trim()).filter(Boolean);
    if (validOptions.length < 2) return apiError(res, "At least 2 options are required.", 400);

    const endsAt = endsInDays ? new Date(Date.now() + Number(endsInDays) * 86400000) : null;

    const poll = await Poll.create({
      startupId: scope.canonicalId,
      founderId: scope.founderUserId || scope.canonicalId,
      question: question.trim(),
      description: String(description || "").trim(),
      options: validOptions.map((text, idx) => ({ id: `opt_${randomBytes(4).toString("hex")}_${idx}`, text, votes: [] })),
      allowMultiple: Boolean(allowMultiple),
      anonymous: Boolean(anonymous),
      endsAt,
      status: "active",
      createdBy: String(req.user.id),
      createdByName: String(req.user.name || req.user.email || ""),
    });

    const dto = mapPollDto(poll);
    emitRealtime(SOCKET_EVENTS.POLL_CREATED, dto, [startupRoom(scope.canonicalId)]);
    return apiSuccess(res, dto, 201);
  }),
);

pollsRouter.post(
  "/startups/:startupId/polls/:pollId/vote",
  requireAuth,
  asyncHandler(async (req, res) => {
    const scope = await canAccessPolls(req, req.params.startupId);
    if (!scope) return apiError(res, "Forbidden.", 403);

    const { optionId } = req.body || {};
    if (!optionId) return apiError(res, "optionId is required.", 400);

    const poll = await Poll.findOne({ _id: req.params.pollId, startupId: scope.canonicalId });
    if (!poll) return apiError(res, "Poll not found.", 404);
    if (poll.status !== "active") return apiError(res, "Poll is closed.", 400);
    if (poll.endsAt && poll.endsAt < new Date()) return apiError(res, "Poll has expired.", 400);

    const userId = String(req.user.id);
    const targetOption = poll.options.find((o) => o.id === optionId);
    if (!targetOption) return apiError(res, "Option not found.", 404);

    if (!poll.allowMultiple) {
      poll.options.forEach((o) => { o.votes = o.votes.filter((v) => v !== userId); });
    }

    const opt = poll.options.find((o) => o.id === optionId);
    if (!opt.votes.includes(userId)) {
      opt.votes.push(userId);
    } else if (poll.allowMultiple) {
      opt.votes = opt.votes.filter((v) => v !== userId);
    }

    await poll.save();
    const dto = mapPollDto(poll);
    emitRealtime(SOCKET_EVENTS.POLL_UPDATED, dto, [startupRoom(scope.canonicalId)]);
    return apiSuccess(res, dto);
  }),
);

pollsRouter.patch(
  "/startups/:startupId/polls/:pollId/close",
  requireAuth,
  asyncHandler(async (req, res) => {
    const scope = await canAccessPolls(req, req.params.startupId);
    if (!scope) return apiError(res, "Forbidden.", 403);
    if (!isFounderOf(req, scope)) return apiError(res, "Only founders can close polls.", 403);

    const poll = await Poll.findOneAndUpdate(
      { _id: req.params.pollId, startupId: scope.canonicalId },
      { status: "closed" },
      { new: true },
    );
    if (!poll) return apiError(res, "Poll not found.", 404);

    const dto = mapPollDto(poll);
    emitRealtime(SOCKET_EVENTS.POLL_UPDATED, dto, [startupRoom(scope.canonicalId)]);
    return apiSuccess(res, dto);
  }),
);

export default pollsRouter;
