// packages/database/src/schema/userAccess.ts
import { pgTable, uuid, boolean } from "drizzle-orm/pg-core";
import { users } from "./users";
import { organizations } from "./organizations";
import { roles } from "./roles";

export const userAccess = pgTable("useraccess", {
  id: uuid("id").primaryKey().defaultRandom(),

  // Siapa usernya?
  userId: uuid("userId")
    .references(() => users.id)
    .notNull(),

  // Di organisasi mana?
  organizationId: uuid("organizationId")
    .references(() => organizations.id)
    .notNull(),

  // Apa perannya di organisasi tersebut?
  roleId: uuid("roleId")
    .references(() => roles.id)
    .notNull(),

  // Apakah ini organisasi utama saat dia pertama kali login?
  isDefault: boolean("isDefault").default(false),

  // Status akses
  isActive: boolean("isActive").default(true),
});
