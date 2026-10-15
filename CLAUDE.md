# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run setup` — install deps, `prisma generate`, `prisma migrate dev` (first-time setup)
- `npm run dev` — Next.js dev server (Turbopack) at http://localhost:3000
- `npm run build` / `npm start` — production build / serve
- `npm run lint` — `next lint`
- `npm test` — Vitest (jsdom); single file: `npx vitest run src/lib/__tests__/file-system.test.ts`; by name: `npx vitest run -t "pattern"`
- `npm run db:reset` — reset the SQLite database

`ANTHROPIC_API_KEY` in `.env` is optional. Without it, `getLanguageModel()` (`src/lib/provider.ts`) returns `MockLanguageModel`, which streams canned Counter/Form/Card components via the same tool calls (and `/api/chat` limits `maxSteps` to 4 instead of 40).

## Architecture

UIGen is a Next.js 15 (App Router, React 19, Tailwind 4) app where a user chats with Claude to generate React components that render in a live preview. No generated files touch disk.

**Chat → tools → virtual FS loop**
- `src/app/api/chat/route.ts` receives `{messages, files, projectId}`, rebuilds a `VirtualFileSystem` (`src/lib/file-system.ts`) from the serialized client files, and calls `streamText` (Vercel AI SDK) with two tools: `str_replace_editor` (`src/lib/tools/str-replace.ts`) and `file_manager` (`src/lib/tools/file-manager.ts`). The system prompt lives inline in this route; it requires a root `/App.jsx` default export and `@/` import aliases for non-library files.
- Tool calls stream back to the client; `src/lib/contexts/chat-context.tsx` forwards them to `handleToolCall` in `src/lib/contexts/file-system-context.tsx`, which applies the same edits to the client-side `VirtualFileSystem` and bumps `refreshTrigger`.
- So the file system exists twice (server, per request, and client); the client sends its full serialized state on each chat request.
- On finish, if `projectId` is set and a session exists, the route persists `messages` and the serialized FS (both as JSON strings) to the `Project` row.

**Preview**
- `src/components/preview/PreviewFrame.tsx` picks an entry point (`/App.jsx`, `/App.tsx`, `/index.*`, …) and uses `src/lib/transform/jsx-transformer.ts` to Babel-transform (`@babel/standalone`) each file, build an ES module import map (blob URLs, placeholder modules for missing imports, CSS collected separately), and render it into an iframe via generated HTML.

**Auth & persistence**
- Prisma + SQLite (`prisma/dev.db`). Prisma client is generated to `src/generated/prisma` (not `@prisma/client`'s default location) — import from there. Models: `User`, `Project` (`userId` nullable so anonymous projects are possible).
- Custom JWT cookie sessions with `jose` in `src/lib/auth.ts`; `src/middleware.ts` guards `/api/projects` and `/api/filesystem`. Server actions in `src/actions/` handle project CRUD.
- Anonymous users can work without signing in; `src/lib/anon-work-tracker.ts` tracks their work so it can be carried over on sign-up/sign-in. Signed-in users are routed to `/[projectId]`.

**UI**: shadcn-style primitives in `src/components/ui`, feature components in `chat/`, `editor/` (Monaco), `preview/`, `auth/`. Path alias `@/` → `src/`.

Tests live in `__tests__` folders next to the code they cover.
