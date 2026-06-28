// packages/database/src/mysql/userAccess.ts
import { mysqlTable, boolean } from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";
import { binaryUuid } from "../utils/uuid"; // Panggil dari helper!
import { users } from "./users";
import { organizations } from "./organizations";
import { roles } from "./roles";

export const userAccess = mysqlTable("useraccess", {
  id: binaryUuid("id")
    .default(sql`(UUID_TO_BIN(UUID()))`)
    .primaryKey(),

  userId: binaryUuid("userId")
    .references(() => users.id)
    .notNull(),

  organizationId: binaryUuid("organizationId")
    .references(() => organizations.id)
    .notNull(),

  roleId: binaryUuid("roleId")
    .references(() => roles.id)
    .notNull(),

  isDefault: boolean("isDefault").default(false),
  isActive: boolean("isActive").default(true),
});
