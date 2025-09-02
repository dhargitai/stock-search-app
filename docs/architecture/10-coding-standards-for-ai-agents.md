# 10. Coding Standards for AI Agents

- **Type Safety is Paramount**: All functions and variables must have explicit types. The `any` type is forbidden.
- **Environment Variables**: Access environment variables only through a centralized configuration module. Never use `process.env` directly in components or API logic.
- **API Interaction**: All data fetching must be done through tRPC hooks (`api.stock.search.useQuery`). Direct `fetch` calls are not allowed.
- **Database Interaction**: All database operations must go through the Prisma client. No raw SQL queries are permitted.
- **Error Handling**: All tRPC procedures must include structured error handling and return specific tRPC error codes.