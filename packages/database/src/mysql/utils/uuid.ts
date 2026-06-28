// packages/database/src/utils/uuid.ts
import { sql } from "drizzle-orm";
import { customType } from "drizzle-orm/mysql-core";

export const binaryUuid = customType<{ data: string; driverData: Buffer }>({
  dataType() {
    return "binary(16)";
  },
  toDriver(value) {
    return sql`UUID_TO_BIN(${value})`;
  },
  fromDriver(value) {
    // Memastikan konversi dari Buffer ke format UUID string yang benar
    return value
      .toString("hex")
      .replace(/^(.{8})(.{4})(.{4})(.{4})(.{12})$/, "$1-$2-$3-$4-$5");
  },
});
