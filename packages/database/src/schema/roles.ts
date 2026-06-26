// packages/database/src/schema/roles.ts
import { pgTable, uuid, varchar, jsonb, timestamp } from "drizzle-orm/pg-core";
import { organizations } from "./organizations";

export const roles = pgTable("roles", {
  id: uuid("id").primaryKey().defaultRandom(),

  // Terikat dengan organizationId agar role spesifik untuk organisasi tersebut
  organizationId: uuid("organizationId")
    .references(() => organizations.id)
    .notNull(),

  name: varchar("name", { length: 50 }).notNull(),
  description: varchar("description", { length: 255 }),

  // Kolom JSON untuk akses dan kebijakan
  permissions: jsonb("permissions").default([]).notNull(),
  policies: jsonb("policies").default({}).notNull(),

  // Audit Trail
  createdBy: uuid("createdBy"),
  createdDate: timestamp("createdDate").defaultNow().notNull(),
  lastUpdateBy: uuid("lastUpdateBy"),
  lastUpdateDate: timestamp("lastUpdateDate").defaultNow().notNull(),
});
