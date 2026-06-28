import { mysqlTable, varchar, json, timestamp } from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";
import { binaryUuid } from "../utils/uuid";
import { organizations } from "./organizations";

export const roles = mysqlTable("roles", {
  id: binaryUuid("id")
    .default(sql`(UUID_TO_BIN(UUID()))`)
    .primaryKey(),

  // Terikat dengan organizationId agar role spesifik untuk organisasi tersebut
  organizationId: binaryUuid("organizationId")
    .references(() => organizations.id)
    .notNull(),

  name: varchar("name", { length: 50 }).notNull(),
  description: varchar("description", { length: 255 }),

  // Kolom JSON di MySQL 8.0+
  permissions: json("permissions")
    .default(sql`'[]'`)
    .notNull(),
  policies: json("policies")
    .default(sql`'{}'`)
    .notNull(),

  // Audit Trail
  createdBy: binaryUuid("createdBy"),
  createdDate: timestamp("createdDate").defaultNow().notNull(),
  lastUpdateBy: binaryUuid("lastUpdateBy"),
  lastUpdateDate: timestamp("lastUpdateDate")
    .defaultNow()
    .onUpdateNow()
    .notNull(),
});
