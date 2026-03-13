---
name: API path prefix convention
description: All server-side API routes must start with /api to avoid routing conflicts
type: feedback
---

All server-side API endpoints must use `/api` prefix (e.g. `/api/health`, `/api/agents`).

**Why:** Avoids routing conflicts between frontend SPA routes and backend API routes, especially with nginx reverse proxy setups.

**How to apply:** When creating or modifying backend routes (relay, node), always prefix with `/api`. Update nginx proxy rules accordingly.
