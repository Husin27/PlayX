// packages/database/src/schema/organizations.ts
import {
  pgTable,
  uuid,
  varchar,
  boolean,
  timestamp,
} from "drizzle-orm/pg-core";

export const userCompanies = pgTable("organizations", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  addressLine1: varchar("addressLine1", { length: 255 }), // Nama jalan/gedung
  addressLine2: varchar("addressLine2", { length: 255 }), // Detail tambahan (Blok, Lantai)
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 100 }), // Provinsi
  postalCode: varchar("postalCode", { length: 20 }),
  country: varchar("country", { length: 100 }), // Atau gunakan ISO Code 2 digit (misal: 'ID')

  phone: varchar("phone", { length: 50 }), // Menggunakan varchar(50) untuk mengakomodasi format internasional (+62...)
  phone2: varchar("phone2", { length: 50 }), // Menggunakan varchar(50) untuk mengakomodasi format internasional (+62...)
  fax: varchar("fax", { length: 50 }),
  email: varchar("email", { length: 255 }), // Panjang standar email
  email2: varchar("email2", { length: 255 }), // Panjang standar email
  webAddress: text("webAddress"), // Menggunakan text untuk fleksibilitas URL

  logoUrl: text("logoUrl"), // Menggunakan text untuk menampung URL yang panjang
  memo: text("memo"), // Tambahan kolom untuk catatan bebas
  settings: jsonb("settings").default({}),
  isActive: boolean("isActive").default(true),

  // Audit Trail
  createdBy: uuid("createdBy"),
  createdDate: timestamp("createdDate").defaultNow().notNull(),
  lastUpdateBy: uuid("lastUpdateBy"),
  lastUpdateDate: timestamp("lastUpdateDate").defaultNow().notNull(),
});
