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
import { branches } from "./branches";

export const projects = mysqlTable("projects", {
  id: binaryUuid("id")
    .default(sql`(UUID_TO_BIN(UUID()))`)
    .primaryKey(),

  branchId: binaryUuid("branchId")
    .references(() => branches.id)
    .notNull(),

  name: varchar("name", { length: 255 }).notNull(),
  code: varchar("code", { length: 50 }),
  description: text("description"),

  isSystem: boolean("isSystem").default(false), // Diperbaiki ke camelCase
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
