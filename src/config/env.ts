import 'dotenv/config';
import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  CORS_ORIGINS: z.string().default('http://localhost:5173,http://127.0.0.1:5173').transform((value) => value.split(',').map((origin) => origin.trim()).filter(Boolean)),
  SUPABASE_URL: z.string().url(),
  SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
  SUPABASE_SECRET_KEY: z.string().min(1),
  MCP_RESOURCE_URL: z.string().url().default('http://localhost:3000/mcp'),
  MCP_AUTHORIZATION_SERVER_URL: z.string().url().default('http://localhost:3000/mcp'),
  MCP_CLIENT_ID: z.string().min(1).default('claude'),
  MCP_REDIRECT_URI: z.string().url().default('http://localhost:5173/mcp/authorize'),
  MCP_AUTH_UI_URL: z.string().url().default('http://localhost:5173/mcp/authorize'),
  REDIS_REST_URL: z.string().url(),
  REDIS_REST_TOKEN: z.string().min(1),
});

export type Env = z.infer<typeof schema>;

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment configuration:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
