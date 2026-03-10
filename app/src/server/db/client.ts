import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { getRuntimeDatabaseUrl } from "./env.ts";
import { relations } from "./relations.ts";

declare global {
  // eslint-disable-next-line no-var
  var __dndPostgresClient__: postgres.Sql | undefined;
}

function createClient() {
  return postgres(getRuntimeDatabaseUrl(), {
    onnotice: process.env.NODE_ENV === "development" ? console.debug : undefined,
  });
}

const client = globalThis.__dndPostgresClient__ ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalThis.__dndPostgresClient__ = client;
}

export { client };

export const db = drizzle({
  client,
  schema: relations,
  casing: "snake_case",
});
