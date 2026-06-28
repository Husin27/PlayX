// packages/database/src/schema/projects.ts
import {
  pgTable,
  uuid,
  varchar,
  boolean,
  timestamp,
  jsonb,
  text,
} from "drizzle-orm/pg-core";
import { branches } from "./branches";

export const projects = pgTable("projects", {
  id: uuid("id").primaryKey().defaultRandom(),
  branchId: uuid("branchId")
    .references(() => branches.id)
    .notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  code: varchar("code", { length: 50 }), // Kode proyek sering dibutuhkan
  description: text("description"),

  issystem: boolean("issystem").default(false),
  settings: jsonb("settings").default({}),
  isActive: boolean("isActive").default(true),

  createdBy: uuid("createdBy"),
  createdDate: timestamp("createdDate").defaultNow().notNull(),
  lastUpdateBy: uuid("lastUpdateBy"),
  lastUpdateDate: timestamp("lastUpdateDate").defaultNow().notNull(),
});
