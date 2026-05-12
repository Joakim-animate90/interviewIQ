# Suggested commit plan

Each commit is small and self-contained. You can squash on merge or keep granular history.

1. **chore: bootstrap monorepo with workspaces, tooling, env example**
2. **feat(server): add Express app skeleton with security middleware, health endpoint, error handler**
3. **feat(server): integrate Gemini 2.0 Flash with schema-constrained JSON output**
4. **feat(server): add input validation, prompt builder, robust response parser**
5. **test(server): supertest route tests + parser + validation + Gemini service unit tests**
6. **feat(client): Vite + React + Tailwind scaffold with strict TS**
7. **feat(client): API client with timeout, typed errors, retry-safe wrapper**
8. **feat(client): question form, loading state, error banner, results list**
9. **test(client): RTL coverage for App flow, API client, validation**
10. **chore: multi-stage Dockerfile, compose, dockerignore**
11. **ci: GitHub Actions lint/typecheck/test/build pipeline**
12. **chore: Vercel preview + production deploy workflow**
13. **docs: README, architecture, prompt engineering, Loom outline**
