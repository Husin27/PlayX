import { pgTable, uuid, jsonb, timestamp } from "drizzle-orm/pg-core";
import { users } from "./users";
import { organizations } from "./organizations";

export const userOverrides = pgTable("useroverrides", {
  id: uuid("id").primaryKey().defaultRandom(),

  // Menggunakan camelCase konsisten (tanpa underscore)
  userId: uuid("userId")
    .references(() => users.id)
    .notNull(),
  organizationId: uuid("organizationId")
    .references(() => organizations.id)
    .notNull(),

  permissions: jsonb("permissions").default({}),
  policies: jsonb("policies").default({}),

  // Audit Trail (tanpa underscore)
  createdBy: uuid("createdBy"),
  createdDate: timestamp("createdDate").defaultNow().notNull(),
  lastUpdateBy: uuid("lastUpdateBy"),
  lastUpdateDate: timestamp("lastUpdateDate").defaultNow().notNull(),
});
