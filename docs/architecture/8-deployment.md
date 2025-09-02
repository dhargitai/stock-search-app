# 8. Deployment

- **Provider**: Vercel.
- **Process**: The application will be linked to a GitHub repository. Every push to the `main` branch will trigger an automatic build and deployment.
- **Environment Variables**: All sensitive keys (Supabase URL, anon key, service role key, Prisma direct URL, Alphavantage API key) will be configured as environment variables in the Vercel project settings.
