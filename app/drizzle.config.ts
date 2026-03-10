import "dotenv/config";
import { defineConfig } from "drizzle-kit";
import { getDrizzleKitDatabaseUrl } from "./src/server/db/env.ts";

const databaseUrl = getDrizzleKitDatabaseUrl();

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/server/db/schema/index.ts",
  out: "./drizzle",
  strict: true,
  verbose: true,
  ...(databaseUrl
    ? {
        dbCredentials: {
          url: databaseUrl,
        },
      }
    : {}),
});
