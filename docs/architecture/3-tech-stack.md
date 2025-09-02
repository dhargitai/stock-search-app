# 3. Tech Stack

This table represents the definitive technology stack for the project. All development must adhere to these choices.

| Category | Technology | Version | Rationale |
| --- | --- | --- | --- |
| **Framework** | Next.js (App Router) | 15.x | Industry standard for SSR React apps; provides a robust serverless backend. |
| **Language** | TypeScript | 5.x | Enforces type safety across the entire project. |
| **API Layer** | tRPC | 11.x | Provides end-to-end type safety between the server and client. |
| **Database** | PostgreSQL (Supabase) | 15.x | Robust, open-source relational database provided by Supabase. |
| **ORM** | Prisma | 6.15.x | Modern, type-safe ORM for interacting with the database. |
| **Authentication** | Supabase Auth | latest | Secure, integrated solution for authentication and user management. |
| **Styling** | TailwindCSS + DaisyUI | 4.x / 5.1.x | Utility-first CSS for rapid UI development with a professional component library. |
| **Client State** | React Query | 5.x | Manages server state, caching, and data fetching on the client. |
| **Charting** | Apache ECharts | 6.x | Powerful and flexible charting library for data visualization. |
| **Deployment** | Vercel | latest | Natively supports Next.js with seamless CI/CD and serverless functions. |
| **Testing** | Vitest, React Testing Library | latest | Modern, fast testing framework for unit and integration tests. |
