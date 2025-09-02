# 4. Monorepo Project Structure

The project will be organized as a monorepo to facilitate code sharing and maintainability.

```
/peak-finance-app
├── apps/
│   └── web/                      # The Next.js application
│       ├── src/
│       │   ├── app/                # Next.js App Router pages and layouts
│       │   ├── components/         # React components (UI, layout)
│       │   ├── lib/                # Client-side helpers (Supabase client)
│       │   └── server/             # Server-side code
│       │       ├── api/            # tRPC API routers
│       │       ├── db.ts           # Prisma client instantiation
│       │       └── trpc.ts         # tRPC server setup
│       └── next.config.mjs
├── packages/
│   ├── db/                       # Prisma schema and generated client
│   │   ├── prisma/
│   │   │   └── schema.prisma
│   │   └── package.json
│   └── config/                   # Shared configurations
│       ├── eslint-preset.js
│       └── tsconfig/
│           └── base.json
├── package.json
├── pnpm-workspace.yaml
└── tsconfig.json

```
