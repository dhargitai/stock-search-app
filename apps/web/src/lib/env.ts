/**
 * Environment configuration module
 * Centralizes access to environment variables and validates them
 */

interface Environment {
  ALPHA_VANTAGE_API_KEY: string;
  NODE_ENV: string;
}

interface PublicEnvironment {
  NEXT_PUBLIC_SUPABASE_URL: string;
  NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
}

function createEnv(): Environment {
  const alphaVantageApiKey = process.env.ALPHA_VANTAGE_API_KEY;
  
  if (!alphaVantageApiKey) {
    throw new Error('ALPHA_VANTAGE_API_KEY environment variable is required');
  }

  return {
    ALPHA_VANTAGE_API_KEY: alphaVantageApiKey,
    NODE_ENV: process.env.NODE_ENV ?? 'development',
  };
}

function createPublicEnv(): PublicEnvironment {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL environment variable is required');
  }
  
  if (!supabaseAnonKey) {
    throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable is required');
  }

  return {
    NEXT_PUBLIC_SUPABASE_URL: supabaseUrl,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: supabaseAnonKey,
  };
}

export const env = createEnv();
export const publicEnv = createPublicEnv();