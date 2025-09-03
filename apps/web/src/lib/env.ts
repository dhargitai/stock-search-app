/**
 * Environment configuration module
 * Centralizes access to environment variables and validates them
 */

interface Environment {
  ALPHA_VANTAGE_API_KEY: string;
  NODE_ENV: string;
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

export const env = createEnv();