import { defineConfig } from 'vite';
import * as dotenv from 'dotenv';

dotenv.config();

export default defineConfig({
  define: {
    'process.env': JSON.stringify(process.env)
  }
});