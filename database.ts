import { drizzle, BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
import Database from "better-sqlite3";

export const jobs = sqliteTable("jobs", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  status: text("status", { enum: ["created", "active", "failed", "completed"] })
    .default("created")
    .notNull(),
  failedTimes: integer("failed_times").default(0).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(strftime('%s','now'))`),
  updatedAt: integer("updated_at", { mode: "timestamp" }),
});
export type Job = typeof jobs.$inferSelect;

const sqlite = new Database("sqlite.db");
export const db: BetterSQLite3Database = drizzle(sqlite);

export const t = { jobs };
