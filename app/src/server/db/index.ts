export { client, db } from "./client.ts";
export {
  getDrizzleKitDatabaseUrl,
  getMigrationDatabaseUrl,
  getRuntimeDatabaseUrl,
  getTestDatabaseUrl,
} from "./env.ts";
export { relations } from "./relations.ts";
export * as schema from "./schema/index.ts";
