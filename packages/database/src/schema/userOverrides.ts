// packages/database/src/schema/userOverrides.ts

import { pgTable, uuid, jsonb, timestamp } from "drizzle-orm/pg-core";
import { users } from "./users";
import { organizations } from "./organizations";

// Nama tabel di DB: "user_overrides" (snake_case)
// Nama variabel di kode: userOverrides (camelCase)
export const userOverrides = pgTable("useroverrides", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .references(() => users.id)
    .notNull(),
  organizationId: uuid("organization_id")
    .references(() => organizations.id)
    .notNull(),

  permissions: jsonb("permissions").default({}),
  policies: jsonb("policies").default({}),

  // Audit Trail
  createdBy: uuid("created_by"),
  createdDate: timestamp("created_date").defaultNow().notNull(),
  lastUpdateBy: uuid("last_update_by"),
  lastUpdateDate: timestamp("last_update_date").defaultNow().notNull(),
});
