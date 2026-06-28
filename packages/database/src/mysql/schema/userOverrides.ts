// packages/database/src/schema/userOverrides.ts
import { mysqlTable, json, timestamp } from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";
import { binaryUuid } from "../utils/uuid";
import { users } from "./users";
import { organizations } from "./organizations";

export const userOverrides = mysqlTable("useroverrides", {
  id: binaryUuid("id")
    .default(sql`(UUID_TO_BIN(UUID()))`)
    .primaryKey(),

  // Menggunakan camelCase konsisten (tanpa underscore)
  userId: binaryUuid("userId")
    .references(() => users.id)
    .notNull(),

  organizationId: binaryUuid("organizationId")
    .references(() => organizations.id)
    .notNull(),

  permissions: json("permissions").default(sql`'{}'`),
  policies: json("policies").default(sql`'{}'`),

  // Audit Trail (tanpa underscore)
  createdBy: binaryUuid("createdBy"),
  createdDate: timestamp("createdDate").defaultNow().notNull(),
  lastUpdateBy: binaryUuid("lastUpdateBy"),
  lastUpdateDate: timestamp("lastUpdateDate")
    .defaultNow()
    .onUpdateNow()
    .notNull(),
});
