// Export environment variables
export const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

// Function to verify required environment variables are set
export function verifyEnv() {
  const requiredVars = ['VITE_OPENAI_API_KEY'];
  const missingVars = requiredVars.filter(varName => !import.meta.env[varName]);
  
  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}. Please check your .env file.`);
  }
  
  return true;
} 