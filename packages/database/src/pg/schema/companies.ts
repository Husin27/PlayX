import { pgTable, uuid, varchar, jsonb, timestamp } from "drizzle-orm/pg-core";
import { organizations } from "./organizations";

export const companies = pgTable("companies", {
  id: uuid("id").primaryKey().defaultRandom(),

  organizationId: uuid("organizationId")
    .references(() => organizations.id)
    .notNull(),

  name: varchar("name", { length: 255 }).notNull(),
  type: varchar("type", { length: 50 }).notNull(),

  // Menggunakan jsonb agar konsisten dengan MySQL dan mendukung pencarian field
  address: jsonb("address").default({}),

  // Audit Trail (konsisten dengan camelCase tanpa underscore)
  createdBy: uuid("createdBy"),
  createdDate: timestamp("createdDate").defaultNow().notNull(),
  lastUpdateBy: uuid("lastUpdateBy"),
  lastUpdateDate: timestamp("lastUpdateDate").defaultNow().notNull(),
});
