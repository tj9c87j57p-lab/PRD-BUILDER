import "dotenv/config";
import { defineConfig } from "prisma/config";

// Plain process.env access here, not the `env()` helper — `env()` validates
// eagerly at config-load time and throws if DATABASE_URL isn't resolvable
// yet, which breaks `prisma generate` (pure schema codegen, never touches
// the database) during install steps where DATABASE_URL may not be exposed
// the same way it is during the actual build/run phase.
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: process.env.DATABASE_URL,
  },
});
