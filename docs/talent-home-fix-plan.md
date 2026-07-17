# Talent Home Tab — Fix Plan

> Work through each step in order. Do not skip ahead. Mark steps done as you go.

---

## Root Cause Summary

The talent home "Top Matches" section calls `GET /talent/startup-posts` which returns
`StartupPost` documents. The `StartupPost` model has only one data field — `content` (a
plain string). All rich opportunity data (`title`, `stage`, `funding`, `lookingFor`,
`offer`, etc.) that founders fill in when posting is sent as `{ post: ideaData }` by the
frontend, but the controller only reads `req.body?.content` and discards everything else.

The talent mapper does try `parseContentObject(row.content)` to rescue data from a JSON
string, but founders never serialize a JSON string — they pass the full object as the
`post` key. So every talent sees zero matches and every card shows placeholder values.

---

## ✅ Step 1 — Extend the `StartupPost` model with structured fields

**File:** `server/src/models/StartupPost.js`

Add top-level fields that the founder's `ideaData` already produces:

```
title, description, founder, founderName, industry, stage,
lookingFor (String[]), location, commitment, tags (String[]),
teamSize, postedDate, interested, offer (Mixed),
website, linkedinUrl, githubUrl, contactEmail, pitchDeckUrl
```

Keep `content` as an optional fallback string (do not remove it — old data may use it).
All new fields should be optional/default so existing documents are not broken.

---

## ✅ Step 2 — Fix the `createPost` controller to save structured fields

**File:** `server/src/controllers/founders.controller.js` → `createPost`

Currently: `content: req.body?.content || ""`

The founder frontend sends `{ post: ideaData }` where `ideaData` contains all the rich
fields. The controller must:

1. Read `const p = req.body?.post || req.body || {}`.
2. Map every structured field from `p` into the `StartupPost.create({...})` call.
3. Still write `content` as `p.content || JSON.stringify(p)` for backward compatibility.
4. Use `findOneAndUpdate({ founderId }, ..., { upsert: true })` instead of blind `create`
   so re-posting updates the existing record (one post per founder).

---

## ✅ Step 3 — Fix `getStartupPostsFeed` to return enriched data

**File:** `server/src/controllers/talent.controller.js` → `getStartupPostsFeed`

Currently returns raw `StartupPost` lean documents. Two improvements:

1. Populate `founderId` → `{ name: 1 }` so the talent mapper can fill the "by Founder"
   label using `founderName` instead of a truncated ObjectId.
2. Return the `founderName` as a top-level field in each post document (either via
   `.populate()` then map, or a `$lookup` aggregation).

Response shape stays `{ posts, total, page, pageSize }` — no frontend change needed.

---

## ✅ Step 4 — Verify the talent mapper reads the new fields correctly

**File:** `client/src/domains/talent/mappers/talentViewModel.js` → `normalizeOpportunity`

Check that every field the UI renders is covered by the mapper's merge logic:

| UI field | Mapper source (in order of priority) |
|---|---|
| `title` | `merged.title \|\| merged.name` |
| `description` | `merged.description \|\| merged.summary \|\| parsed content` |
| `stage` | `merged.stage` |
| `funding` | `merged.funding` |
| `commitment` | `merged.commitment` |
| `location` | `merged.location` |
| `teamSize` | `merged.teamSize` |
| `lookingFor` | `merged.lookingFor` (array) |
| `tags` | `merged.tags` (array) |
| `offer.equityMin/Max` | `merged.offer.equityMin / equityMax` |
| `founder` | `merged.founder \|\| merged.founderName \|\| merged.ownerName` |
| `industry` | `merged.industry` |
| `founderId` | `merged.founderId \|\| merged.ownerId \|\| merged.createdBy` |

After Step 2 & 3 the new top-level fields will be present and the mapper will pick them
up automatically. No mapper code change should be required — verify this by tracing one
real document after migration.

---

## ✅ Step 5 — Verify `sendInterest` has a valid `founderId`

**File:** `client/src/domains/talent/hooks/useTalentHomeData.js` → `sendInterest`

`resolveFounderId(opportunity)` reads `founderId || ownerId || createdBy`. After Step 3,
`founderId` will be a raw ObjectId string (from the populated document). Confirm:

- The backend `POST /interests/send` → `createInterest` accepts `founderId` as a string
  (it does — Mongoose casts it).
- The talent UI correctly blocks sending if `founderId` is missing, and that error
  message surfaces to the user.

No code change expected here unless a gap is found during testing.

---

## Step 6 — Smoke-test the full round-trip

Manual verification steps:

1. Log in as a **founder**, go to Team Matching, create/update a startup post with all
   fields filled (title, stage, lookingFor, offer equity, etc.).
2. Check MongoDB: confirm the `StartupPost` document has top-level `title`, `stage`,
   `lookingFor`, `offer` fields (not just a `content` string).
3. Log in as a **talent** user with skills filled in the profile.
4. Go to the Home tab — "Top Matches" should show the founder's startup card with a
   non-zero match score, correct title, stage, equity, and "by [FounderName]".
5. Click a card → open dialog → write a message → click "Send Interest".
6. Confirm the `Interest` document is created in MongoDB with correct `talentId`,
   `founderId`, `startupId`, and `message`.
7. Reload the home tab — the card should now show "Interest Expressed" (disabled button).

---

## Step 7 — (Optional) Backfill existing `StartupPost` documents

If there are already `StartupPost` documents whose structured data was lost (only
`content` string saved), write a one-off migration script that:

1. Reads each `StartupPost` where `title` is null/empty.
2. Tries `JSON.parse(doc.content)` to recover the object.
3. Updates the document with the parsed structured fields.

Only needed if real data already exists in the DB that needs recovering.

---

## Files touched in this plan

| File | Step |
|---|---|
| `server/src/models/StartupPost.js` | 1 |
| `server/src/controllers/founders.controller.js` | 2 |
| `server/src/controllers/talent.controller.js` | 3 |
| `client/src/domains/talent/mappers/talentViewModel.js` | 4 (verify only) |
| `client/src/domains/talent/hooks/useTalentHomeData.js` | 5 (verify only) |
