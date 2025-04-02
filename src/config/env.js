import dotenv from 'dotenv';
import dotenvExpand from 'dotenv-expand';

// Load environment variables from .env file
const env = dotenv.config();
dotenvExpand.expand(env);

// Export environment variables
export const OPENAI_API_KEY = process.env.VITE_OPENAI_API_KEY || process.env.OPENAI_API_KEY;

// Function to verify required environment variables are set
export function verifyEnv() {
  const requiredVars = ['OPENAI_API_KEY'];
  const missingVars = requiredVars.filter(varName => {
    // Check for both VITE_ prefixed and regular env vars
    const viteVar = `VITE_${varName}`;
    return !process.env[varName] && !process.env[viteVar];
  });
  
  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}. Please check your .env file.`);
  }
  
  return true;
} 