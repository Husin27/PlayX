import fp from 'fastify-plugin';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import jwt from '@fastify/jwt';
import cookie from '@fastify/cookie';

import { initEnvPlugin } from './config/env';
import { connectAgnosticDatabase } from '@glx/database'; // Paket internal database workspaces Anda!

export default fp(async (fastify, opts) => {
  // 1. HIDUPKAN VALIDATOR LINGKUNGAN (.ENV)
  await initEnvPlugin(fastify);

  // 2. JALANKAN PASUKAN AUTHENTICATION SERVER (BENTENG PERTAHANAN)
  await fastify.register(cookie, {
    secret: fastify.config.JWT_REFRESH_SECRET,
    parseOptions: {}
  });

  await fastify.register(jwt, {
    secret: fastify.config.JWT_ACCESS_SECRET,
    cookie: {
      cookieName: fastify.config.REFRESH_TOKEN_COOKIE_NAME,
      signed: true,
    },
  });

  // 3. LOGIKA SAKLAR DATA AGNOSTIC PERINTAH KOMANDO PAK BOSS RONY!
  let dbEngine: any;
  let dbSchema: any;
  let driverName: 'POSTGRES' | 'MYSQL' | 'SUPABASE';

  if (fastify.config.USE_SUPABASE) {
    // ⚡ JURUS BYPASS 1: JIKA SUPABASE TRUE, ABAIKAN DRIVER LOKAL, TEMBAK KONEKSI SUPABASE ASTRONOT!
    const connectionString = fastify.config.SUPABASE_URL; // Atau parsing URL khusus Supabase DB Anda
    const agnostic = connectAgnosticDatabase('POSTGRES', connectionString);
    dbEngine = agnostic.db;
    dbSchema = agnostic.schema;
    driverName = 'SUPABASE';
  } else {
    // ⚡ JURUS STANDAR: PATUH PADA ROTASI SAKLAR LOKAL (POSTGRES / MYSQL)
    const driver = fastify.config.DB_DRIVER;
    const connectionString = fastify.config.DATABASE_URL;
    const agnostic = connectAgnosticDatabase(driver, connectionString);
    dbEngine = agnostic.db;
    dbSchema = agnostic.schema;
    driverName = agnostic.driverType;
  }

  // SUNTIKKAN STATUS OPERASIONAL KE DALAM TUBUH GLOBAL FASTIFY (DECORATOR)
  fastify.decorate('db', dbEngine);
  fastify.decorate('schema', dbSchema);
  fastify.decorate('activeDriver', driverName);
  fastify.decorate('searchEngine', fastify.config.USE_OPENSEARCH ? 'OPENSEARCH' : 'DATABASE');

  // 4. PASANG BENTENG JEMBATAN LINTAS JARINGAN FRONTEND (CORS)
  await fastify.register(cors, {
    origin: ['http://localhost:3027'], // Mengunci port unik client GLX Anda!
    credentials: true,
  });

  // 5. PASANG SATPAM PEMBATAS TRAFIK (ANTI DOS SPAM)
  await fastify.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
  });

  // 6. JALUR API CEK KESEHATAN SISTEM (HEALTH CHECK)
  fastify.get('/api/v1/health', async (request, reply) => {
    return {
      status: 'online',
      architecture: 'Monorepo Shared Workspaces',
      databaseSSOT: fastify.activeDriver, // Membuktikan bypass Supabase / PG / MySQL terbaca sukses!
      searchEngineEngine: fastify.searchEngine, // Membuktikan OpenSearch switch berfungsi gaib!
      features: {
        supabase: fastify.config.USE_SUPABASE,
        opensearch: fastify.config.USE_OPENSEARCH,
        s3Storage: fastify.config.USE_S3
      }
    };
  });
});
