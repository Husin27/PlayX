export const tenants = pgTable('tenants', {
  id: uuid('id').primaryKey(), // ID yang sama dengan di Server Pusat
  name: varchar('name', { length: 255 }).notNull(),
  licenseKey: varchar('licenseKey', { length: 255 }).notNull(),
  // Tidak ada lagi maxCompanies atau isEnabled di sini
});