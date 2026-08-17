# 0001. GitHub issue import

## Summary

The founder connects one GitHub account with an OAuth App, picks a repo, picks issues, and imports them as normal StartupVerse tasks. Already imported issues are skipped. The founder then assigns those tasks. No webhooks and no two way sync.

## Requirements

**User stories**:
- As a founder, I want to pull GitHub issues into my startup tasks so the team can execute them in the weekly loop.

**Acceptance criteria**:
- **AC-6**: Founder connects GitHub, picks a repo, picks issues, imports as tasks. Duplicate issue identity on that startup is skipped with a message. Founder can assign after import.
- **AC-9**: Only that founder can connect or import. Team members cannot.

## Decision

**Chosen option**: GitHub OAuth App, token stored encrypted on `GitHubConnection` per founder user. One shot copy into `Task` with a stable issue identity, `githubIssueUrl`, `githubRepo`. Use a popup plus callback like the Google connect UI, but implement OAuth for real. Do not copy the Google 501 stub.

Short rationale: an OAuth App is enough for user scoped import. A GitHub App is better later for org installs, too heavy now.

## Feature design

**Data model sketch**:

`GitHubConnection` (new):
- `userId` ObjectId required, unique (the founder)
- `githubUserId` string required
- `githubLogin` string required
- `accessTokenEncrypted` string required (never send to client)
- `scope` string
- `connectedAt` Date
- `revokedAt` Date nullable

`Task` (additive, nullable):
- `githubIssueId` string, format `owner/repo#number` (per repo numbers are not unique across repos)
- `githubIssueUrl` string
- `githubRepo` string (`owner/name`)
- unique sparse index `{ startupId: 1, githubIssueId: 1 }`
- Mongo duplicate key on import is returned as skipped, not 500

**State transitions**:
- GitHub connection: absent → connected → revoked
- Revoked connection cannot list repos until the founder connects again

**API surface**:

| Endpoint | Method | Key inputs | Key outputs | Auth | Key errors |
|---|---|---|---|---|---|
| `/github/oauth/authorize` | GET | | redirect URL | bearer, founder | 403, 503 if env missing |
| `/github/oauth/callback` | GET | code, state | connection created, close popup | GitHub redirect | 400, 401 |
| `/github/connection` | GET | | `{ connected, githubLogin }` (no token) | bearer, founder | 403 |
| `/github/connection` | DELETE | | disconnected | bearer, founder | 403, 404 |
| `/github/repos` | GET | page | repos[] | bearer, founder, connected | 401 if GitHub rejects token |
| `/github/repos/:owner/:repo/issues` | GET | state=open, page | issues[] | bearer, founder | 401, 404 |
| `/github/import` | POST | owner, repo, issueNumbers[] | `{ created: Task[], skipped: [] }` | bearer, founder | 401, 422 |

Imported task title is the issue title. Brief is the issue body (plain text, stripped of HTML, truncated to 5000). `githubIssueUrl` is stored as a link as well.

OAuth scopes: `read:user` and `repo` (private issue import). Document this on the connect button.

**Key invariants**:
- Token never appears in API JSON, logs, or GitHub error bodies forwarded to the client.
- Import is idempotent per `(startupId, githubIssueId)` where id is `owner/repo#number`.
- Import creates tasks with `founderId` and `startupId` of the connected founder. Status `pending`. Unassigned until the founder assigns.
- If GitHub returns 401, mark connection revoked and ask the founder to reconnect.

**Security model**:
- All GitHub routes except the OAuth callback: authenticated founder. Team members 403.
- Callback is a GitHub redirect. `state` is HMAC signed with a server secret, bound to `userId`, single use.
- Encrypt token with `GITHUB_TOKEN_ENCRYPTION_KEY` (32 byte key) before save. Redact tokens in logs.

**Configuration required**:
- `GITHUB_CLIENT_ID`
- `GITHUB_CLIENT_SECRET`
- `GITHUB_CALLBACK_URL`
- `GITHUB_TOKEN_ENCRYPTION_KEY`

The engineer creates the OAuth App at GitHub Developer settings. Homepage is the product origin. Callback must equal `GITHUB_CALLBACK_URL`.

**Critical test scenarios**:
- Happy path: connect, pick repo, pick two issues, two tasks appear and open on the task page, verifies **AC-6**
- Failure: import the same issues again, both skipped, no duplicate rows, verifies **AC-6**
- Failure: missing GitHub env, authorize returns 503 with a clear message, verifies **AC-6**
- Auth: team member POST import returns 403, verifies **AC-9**

## Build plan

1. `GitHubConnection` model, 32 byte encrypt helpers, sparse unique index on `startupId` + `owner/repo#number`. Satisfies **AC-6**
2. OAuth authorize and callback with HMAC `state`. Connection GET/DELETE. Settings or Office: Connect GitHub. 503 if env missing. Satisfies **AC-6**, **AC-9**
3. List repos, list open issues, import selected. Skip duplicates and duplicate key. Satisfies **AC-6**
4. After import, show the new tasks in the list with a GitHub link. Founder assigns with existing assign API. Satisfies **AC-6**

## Consequences

**Positive**: engineering work enters the same loop as weekly tasks.
**Negative / tradeoffs**: `repo` scope is broad. Tokens can expire. No sync, so GitHub and StartupVerse can drift.
**Neutral**: GitHub stays off until env vars are set. The rest of the hub can ship without them.

## Follow-up

- [ ] Engineer must create the OAuth App and paste the four env vars before this slice can be demoed.
- [ ] Webhooks, closing GitHub issues from StartupVerse, and team member connect are out of scope.
