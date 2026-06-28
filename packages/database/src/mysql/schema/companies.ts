import { mysqlTable, varchar, json, timestamp } from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";
import { binaryUuid } from "../utils/uuid";
import { organizations } from "./organizations";

export const companies = mysqlTable("companies", {
  id: binaryUuid("id")
    .default(sql`(UUID_TO_BIN(UUID()))`)
    .primaryKey(),

  organizationId: binaryUuid("organizationId")
    .references(() => organizations.id)
    .notNull(),

  name: varchar("name", { length: 255 }).notNull(),
  type: varchar("type", { length: 50 }).notNull(), // 'VENDOR', 'CUSTOMER'

  // Menggunakan JSON agar bisa dicari per field (city, postalCode, dll)
  // Contoh isi: { "street": "Jl. ...", "city": "Jember", "postalCode": "68121" }
  address: json("address").default(sql`'{}'`),

  createdBy: binaryUuid("createdBy"),
  createdDate: timestamp("createdDate").defaultNow().notNull(),
  lastUpdateBy: binaryUuid("lastUpdateBy"),
  lastUpdateDate: timestamp("lastUpdateDate")
    .defaultNow()
    .onUpdateNow()
    .notNull(),
});
