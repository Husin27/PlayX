import {
  mysqlTable,
  varchar,
  timestamp,
  boolean,
  uniqueIndex,
} from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";
import { binaryUuid } from "../utils/uuid"; // Import helper dari folder utils

export const users = mysqlTable(
  "users",
  {
    // Menggunakan helper global
    id: binaryUuid("id")
      .default(sql`(UUID_TO_BIN(UUID()))`)
      .primaryKey(),

    username: varchar("username", { length: 50 }).notNull(),
    password: varchar("password", { length: 255 }).notNull(),
    email: varchar("email", { length: 255 }).notNull(),
    fullName: varchar("fullName", { length: 255 }),
    isActive: boolean("isActive").default(true),

    // Menggunakan helper global untuk audit trail
    createdBy: binaryUuid("createdBy"),
    createdDate: timestamp("createdDate").defaultNow().notNull(),
    lastUpdateBy: binaryUuid("lastUpdateBy"),
    lastUpdateDate: timestamp("lastUpdateDate")
      .defaultNow()
      .onUpdateNow()
      .notNull(),
  },
  (table) => ({
    usernameIdx: uniqueIndex("username_idx").on(table.username),
    emailIdx: uniqueIndex("email_idx").on(table.email),
  }),
);
