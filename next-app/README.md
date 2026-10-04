# PGConnect — web app

Next.js 15 app (UI + REST API + Prisma/PostgreSQL) for the PGConnect PG & co-living marketplace.

Setup, environment variables, deployment and security notes live in the **[root README](../README.md)**;
conventions and the route map in [`docs/ARCHITECTURE.md`](../docs/ARCHITECTURE.md).

```bash
cp .env.example .env    # set JWT_SECRET at minimum
yarn install
yarn db:migrate && yarn db:seed
yarn dev                # http://localhost:3000
```

Checks: `yarn lint`, `yarn typecheck`, `yarn test`. Health endpoint: `GET /api/health`.
