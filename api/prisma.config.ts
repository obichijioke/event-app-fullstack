import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

export default defineConfig({
  // Paths are relative to the current working directory (api/)
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  engine: 'classic',
  datasource: {
    url: env('DATABASE_URL'),
  },
});

