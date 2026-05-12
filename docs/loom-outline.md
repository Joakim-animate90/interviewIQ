# Loom walkthrough outline (~5 min)

A talk track designed to land "thoughtful founding engineer" — not "I memorised the README."

## 0:00 – 0:30 · Demo first

- Show the app running. Type "Senior Backend Engineer" → 3 questions.
- Try an empty submit → inline validation.
- Throttle network in devtools or stop the server → error banner + "Try again".

> "I want to lead with what it does, then take you through how it's built and the decisions I made."

## 0:30 – 1:15 · Tech choices and the why

- Vite + React + Tailwind on the client; Express + TS on the server; Gemini 2.0 Flash via `@google/genai`.
- Why this stack: shippable in a day, easy to hire for, every piece is mainstream.
- Why Gemini Flash specifically: latency, cost, native JSON-mode with `responseSchema`.

## 1:15 – 2:15 · Architecture

Open the repo tree.

- Two packages in one repo via npm workspaces — clean separation, one install.
- API key is server-side only. The browser only talks to `/api/questions`.
- In production, Express serves both the API and the built React app — one container, one port. Simplest thing that scales for early stage.
- Show `server/src/services/gemini.ts` — the only place we talk to Gemini, behind a `QuestionGenerator` interface. Easy to swap providers later.

## 2:15 – 3:00 · Prompt engineering

Open `server/src/lib/prompt.ts`.

- Two-channel prompt: system instruction (constant, defines persona + rules + injection guard) and user turn (only the sanitised job title).
- `responseMimeType: 'application/json'` + `responseSchema` make output deterministic.
- Fallback parser in `parseQuestions.ts` handles markdown-wrapped, prose-wrapped, or list outputs — defence in depth so the UI never breaks.

## 3:00 – 3:45 · Errors and reliability

- Open `server/src/lib/errors.ts` and the error middleware.
- One `ApiError` class with typed codes → consistent error shape on the wire.
- Client maps each code to a user-friendly message; never shows raw error text.
- Both ends have request timeouts (`AbortController` on the client, `Promise.race` on the server).
- Server rate-limits to 30 req/min/IP; helmet + 8 KB body cap.

## 3:45 – 4:30 · Testing

- Vitest everywhere, behavior-focused.
- Walk through `tests/parseQuestions.test.ts` — every fallback covered.
- `tests/questions.route.test.ts` — supertest hitting the real Express app with the SDK mocked at module boundary.
- `tests/App.test.tsx` — full flow including loading, success, retry-on-error.

## 4:30 – 5:00 · Production readiness + what's next

- Dockerfile is multi-stage, non-root, has a healthcheck. CI runs lint/typecheck/test/build on every PR. Vercel deploy workflow ready to wire.
- What I'd add with more time: streaming responses, per-user history (Postgres + magic-link auth), eval dataset from thumbs up/down, multi-provider, OpenTelemetry traces.
- Close: "Optimised for clarity and shipping — the kind of code base I'd want a new engineer to be productive in on day one."
