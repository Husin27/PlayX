// packages/database/src/schema/users.ts
import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  boolean,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),

  // Data identitas login saja
  username: varchar("username", { length: 50 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  fullName: varchar("fullName", { length: 255 }),
  isActive: boolean("isActive").default(true),

  // Audit Trail
  createdBy: uuid("createdBy"),
  createdDate: timestamp("createdDate").defaultNow().notNull(),
  lastUpdateBy: uuid("lastUpdateBy"),
  lastUpdateDate: timestamp("lastUpdateDate").defaultNow().notNull(),
});
