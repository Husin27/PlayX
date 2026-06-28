// packages/database/src/mysql/organizations.ts
import {
  mysqlTable,
  varchar,
  boolean,
  timestamp,
  json,
  text,
} from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";
import { binaryUuid } from "../utils/uuid";

export const organizations = mysqlTable("organizations", {
  id: binaryUuid("id")
    .default(sql`(UUID_TO_BIN(UUID()))`)
    .primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),

  addressLine1: varchar("addressLine1", { length: 255 }),
  addressLine2: varchar("addressLine2", { length: 255 }),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 100 }),
  postalCode: varchar("postalCode", { length: 20 }),
  country: varchar("country", { length: 100 }),

  phone: varchar("phone", { length: 50 }),
  phone2: varchar("phone2", { length: 50 }),
  fax: varchar("fax", { length: 50 }),
  email: varchar("email", { length: 255 }),
  email2: varchar("email2", { length: 255 }),
  webAddress: text("webAddress"),

  logoUrl: text("logoUrl"),
  memo: text("memo"),
  settings: json("settings").default(sql`'{}'`),
  isActive: boolean("isActive").default(true),

  createdBy: binaryUuid("createdBy"),
  createdDate: timestamp("createdDate").defaultNow().notNull(),
  lastUpdateBy: binaryUuid("lastUpdateBy"),
  lastUpdateDate: timestamp("lastUpdateDate")
    .defaultNow()
    .onUpdateNow()
    .notNull(),
});
