// packages/database/src/schema/companies.ts
import { pgTable, uuid, varchar, text, timestamp } from 'drizzle-orm/pg-core';
import { userCompanies } from './userCompanies';

export const companies = pgTable('companies', {
  id: uuid('id').primaryKey().defaultRandom(),
  userCompanyId: uuid('userCompanyId').references(() => userCompanies.id).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  type: varchar('type', { length: 50 }).notNull(),
  address: text('address'),

  createdBy: uuid('createdBy'),
  createdDate: timestamp('createdDate').defaultNow().notNull(),
  lastUpdateBy: uuid('lastUpdateBy'),
  lastUpdateDate: timestamp('lastUpdateDate').defaultNow().notNull(),
});