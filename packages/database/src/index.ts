import {
  drizzle as drizzlePg,
  NodePgDatabase,
} from "drizzle-orm/node-postgres";
import { drizzle as drizzleMysql, MySql2Database } from "drizzle-orm/mysql2";
import pg from "pg";
import mysql from "mysql2/promise";

// 🔌 MENGGULUNG MASSAL SELURUH RE-EXPORT TABEL DARI FOLDER MASING-MASING DIALEK
import * as pgSchema from "./pg/schema";
import * as mysqlSchema from "./mysql/schema";

// 🛡️ KUNCI TIPE DATA KASTA TERTINGGI: MENGGUNAKAN NodePgDatabase SESUAI ATURAN RESMI DRIZZLE!
export interface AgnosticDatabase {
  db: NodePgDatabase<typeof pgSchema> | MySql2Database<typeof mysqlSchema>;
  schema: typeof pgSchema | typeof mysqlSchema;
  driverType: "POSTGRES" | "MYSQL";
}

export function connectAgnosticDatabase(
  driver: "POSTGRES" | "MYSQL",
  connectionString: string,
): AgnosticDatabase {
  if (driver === "POSTGRES") {
    // Jalur pipa biner PostgreSQL murni (node-postgres pool)
    const pool = new pg.Pool({ connectionString });
    return {
      db: drizzlePg(pool, { schema: pgSchema }),
      schema: pgSchema,
      driverType: "POSTGRES",
    };
  } else if (driver === "MYSQL") {
    // Jalur pipa biner MySQL murni (mysql2 promise pool)
    const pool = mysql.createPool({ uri: connectionString });

    // 🧯 TRIK JINAKKAN ESLINT: Gunakan casting 'unknown' sebelum masuk ke tipe Drizzle Database asli!
    const dbInstance = drizzleMysql(pool as unknown as mysql.Pool, {
      schema: mysqlSchema,
      mode: "default",
    });

    return {
      db: dbInstance as unknown as MySql2Database<typeof mysqlSchema>,
      schema: mysqlSchema,
      driverType: "MYSQL",
    };
  }

  // ERROR MESSAGE IN ENGLISH AS REQUESTED, PAK BOSS!
  throw new Error(
    `Database architecture crash: Driver [${driver}] is rejected by the system rules!`,
  );
}
