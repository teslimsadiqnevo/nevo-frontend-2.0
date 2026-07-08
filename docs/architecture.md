# Frontend Architecture

How the Nevo frontend is organized, and the decisions behind it. Distilled from
the Frontend Architecture spec (Sections 1, 2, 8), the Complete Product
Architecture, and the Design System v2. The full specs are local-only in
`context/`.

## Overview

Nevo is **one product expressed as three experiences**, sharing one identity,
permission, and data model:

- **Student App** — tablet-first, calm, low cognitive load
- **Teacher Console** — responsive across desktop and tablet
- **School Admin Layer** — desktop-first, permission-scoped

The codebase is organized **by application context, not by component type** — so
each app's screens, components, and logic live in their own directories rather
than in one flat `/components` folder.

## Stack

| Concern | Choice |
| --- | --- |
| Framework | Next.js 16 (App Router, Turbopack by default) |
| UI runtime | React 19.2 |
| Language | TypeScript 5 (strict) |
| Styling | Tailwind CSS v4 — **CSS-first `@theme`**, no `tailwind.config.ts` |
| Components | [shadcn/ui](https://ui.shadcn.com) on the **Radix** base (`radix-nova`) |
| Icons | lucide-react |
| Fonts | Inter (body/UI), Agile (brand/wordmark only) |
| State | React Context (no Redux/Zustand unless complexity demands it) |
| Backend | FastAPI (all AI via a backend Gemini gateway — never called from the client) |

## Project structure

```
src/
  app/                      App Router — organized by application context
    student/                Student App routes
    teacher/                Teacher Console routes
    admin/                  School Admin Layer routes
    auth/                   Shared auth routes
    landing/                Public landing page
    layout.tsx              Root layout
    page.tsx                Entry point / role-based redirect
  components/
    ui/                     shadcn primitives (generated; kept isolated)
    shared/                 Cross-app compositions (Navigation, Auth, States, …)
    student/                Student-specific components
    teacher/                Teacher-specific components
    admin/                  Admin-specific components
  hooks/                    Custom React hooks
  lib/
    api/                    API client + endpoint modules (FastAPI)
    gemini/                 Placeholder — never called from the frontend
    utils/                  zeroTag, formatProfile, formatTime, cn
    constants/              permissions, eventTypes, breakTypes
  styles/
    tokens/                 Design System v2 tokens (source of truth)
  app/globals.css           Tailwind entry + @theme (mirrors tokens)
  proxy.ts                  Auth guard (Next.js 16 replacement for middleware)
```

`components/ui/` (shadcn's generated primitives) is kept separate from
`components/shared/` (Nevo compositions built on top) so shadcn upgrades never
touch custom logic.

## Routing & application contexts

Routes use **literal path segments** (`/student/dashboard`, not route groups).
Each context has a `layout.tsx` that will host its auth guard, providers, and
navigation.

- `/landing`
- `/auth` → `login`, `sso-callback`, `forgot-password`, `forgot-pin`
- `/student` → `onboarding`, `dashboard`, `lessons`, `lessons/[lessonId]`,
  `progress`, `downloads`, `connect`, `profile`
- `/teacher` → `onboarding`, `dashboard`, `classes`, `classes/[classId]`,
  `lessons`, `lessons/upload`, `lessons/[lessonId]`, `students`,
  `students/[studentId]`, `insights`, `connect`, `profile`
- `/admin` → `onboarding`, `dashboard`, `classes`, `classes/[classId]`,
  `teachers`, `teachers/[teacherId]`, `students`, `students/[studentId]`,
  `senco`, `senco/[studentId]`, `senco/export`, `reports`,
  `settings/{sso,billing,general}`, `permissions`

**Next.js 16 note:** dynamic `params` is a `Promise` and must be awaited inside
the page/layout.

The root `/` handles entry routing: unauthenticated → landing / `auth/login`;
authenticated → role dashboard. SSO schools enter via a school-specific URL,
with first-use detection routing new students into onboarding.

## Auth guard — `proxy.ts` (not `middleware`)

Next.js 16 **deprecated the `middleware` convention and renamed it to `proxy`**.
The auth guard is implemented as `src/proxy.ts` (Node.js runtime only — no
`edge`). It is an **optimistic** guard: a cheap cookie/JWT check plus redirects.
Real authorization is enforced per-page/layout and at the API layer.

Route protection:

- `/student/*` → `student` role
- `/teacher/*` → `teacher` role
- `/admin/*` → any admin scope, then per-page scope checks via `usePermissions`
- `/admin/senco/*` → SENCo scope · `/admin/settings/sso` → IT ·
  `/admin/settings/billing` → billing
- Unauthenticated → `/auth/login`

## Components

Grouped by context (`shared`, `student`, `teacher`, `admin`) plus generated
`ui/`. Components are built along the way as features are implemented; the spec's
Section 1 component tree is the reference list. shadcn mappings (from the spec):
Break Module → Dialog, Ask Nevo → Sheet, Toggle Bar → ToggleGroup, Notifications
→ Popover + sonner Toast, Lesson Upload → Form (react-hook-form).

## Hooks (`src/hooks/`)

- `useAuth` — auth state, SSO detection, session management
- `useProfile` — learner profile data access
- `useSignals` — batches signal events → `/api/signals/` (every 5s / 20 events /
  on exit); exposes `trackEvent`
- `useBreakMonitor` — client-side break-threshold monitoring
- `useAdaptation` — fetch/apply the lesson's adaptation plan
- `useNotifications` — notification polling/subscription
- `usePermissions` — admin permission-scope checks
- `useRosterSync` — roster sync status (admin)

## API client (`src/lib/api/`)

All backend calls go through a centralized client (`client.ts`): per-environment
base URL, auto-attached auth token, standardized user-friendly error handling,
and dev logging. Endpoint modules: `auth`, `signals`, `intelligence`, `content`,
`export`, `askNevo`, `notifications`, `analytics`.

**Gemini is never called from the frontend.** All AI processing goes through the
backend's Gemini gateway — this keeps API keys secure and enforces Zero-Tag
server-side.

## State management (Section 8)

React Context only, to start (no Redux/Zustand unless prop-drilling forces it):

- `AuthContext` — current user, role, school, session
- `PermissionContext` — current admin's scopes (Admin Layer only)
- `LessonContext` — current lesson state, adaptation plan, signal collection
  (Student App only)
- `NotificationContext` — unread counts, notification list

## Design tokens (`src/styles/tokens/`)

TypeScript token files are the source of truth, **mirrored** into
`src/app/globals.css` under `@theme` (Tailwind v4). Change one, change both.

- **Colors** (DS v2 §3): navy `#3b3f6e`, cream `#f7f1e6`, soft violet `#9a9ccb`,
  near-black `#2b2b2f` → `bg-nevo-navy`, `text-nevo-cream`, …
- **Typography** (§2): Inter = `--font-sans` (everything); Agile = `--font-brand`
  (logo/wordmark only — roles never swap; Agile currently falls back to Inter
  until the font files are added)
- **Spacing** (§4): `xs`–`3xl` → `p-md`, `gap-lg`, …
- **Elevation** (§8): near-black-tinted `shadow-elevation-1..3` (Level 3 = break
  module / alerts)
- **Motion** (§10): `--duration-*` + `ease-calm` / `ease-in-out-ds`

## Zero-Tag (`src/lib/utils/zeroTag.ts`)

Client-side, display-level safety net: before rendering profile-related text,
scan for a clinical-term blocklist and replace with a generic fallback. Defense
in depth — the backend schema already makes diagnostic labels structurally
impossible.

## Decision log

- **Radix over Base UI** — shadcn's default (`base-nova`, Base UI) was swapped
  for the Radix base to match the components the specs assume.
- **`proxy` over `middleware`** — required by Next.js 16.
- **Tailwind v4 CSS-first `@theme`** — the spec assumed a v3 `tailwind.config.ts`;
  on v4 we express tokens via `@theme` instead.
- **Tokens mirrored in TS + CSS** — TS for JS consumers, `@theme` for utilities.
- **`context/` PDFs local-only** — sensitive specs stay out of the repo; this
  folder holds the shareable distillation.
