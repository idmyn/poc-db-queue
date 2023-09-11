import type { Config } from "drizzle-kit";

export default {
  schema: "./database.ts",
  driver: "libsql",
  dbCredentials: {
    url: "file:./sqlite.db",
  },
  out: "./drizzle",
} satisfies Config;
