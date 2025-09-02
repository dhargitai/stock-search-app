# 4. Technical Assumptions

* **Repository Structure**: **Monorepo**. This structure will be used to manage the full-stack application, facilitating easy sharing of types and code between the frontend and the tRPC backend.
* **Service Architecture**: **Serverless**. The architecture will leverage the native serverless capabilities of Vercel for deploying Next.js API routes and Supabase for database and authentication.
* **Testing Requirements**: The project will require **Unit and Integration tests**. Unit tests for individual components and utilities, and integration tests for the tRPC endpoints and database interactions.
* **Additional Technical Assumptions**:
    * The tech stack defined in the Project Brief is confirmed: Next.js 15, TypeScript, tRPC, Prisma 6.15, Supabase (PostgreSQL), TailwindCSS, DaisyUI 5.1, React Query, and Apache ECharts v6.
    * Prisma Migrate will be used for all database schema migrations.

---
