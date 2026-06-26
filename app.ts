import { FastifyPluginAsync } from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import { initEnvPlugin } from './config/env'; // Skema TypeBox .env yang kita buat kemarin

const app: FastifyPluginAsync = async (fastify, opts): Promise<void> => {
  // 1. SUNTIKKAN SAKLAR OTOMATISASI VARIABEL LINGKUNGAN (.ENV)
  await initEnvPlugin(fastify);

  // 2. PASANG BENTENG JEMBATAN LINTAS JARINGAN FRONTEND (CORS)
  await fastify.register(cors, {
    origin: ['http://localhost:3027'], // Mengizinkan port unik client GLX Anda menembak data!
    credentials: true,
  });

  // 3. PASANG SATPAM PEMBATAS TRAFIK (ANTI DDOS / BRUTE FORCE SPAM)
  await fastify.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute', // Maksimal 100 ketukan per menit per IP address
  });

  // 4. CONTOH RUTE TES KEWARASAN API
  fastify.get('/api/v1/health', async (request, reply) => {
    return { 
      status: 'healthy', 
      engine: 'Fastify v4 NodeNext',
      activeDriver: fastify.config.DB_DRIVER // Membuktikan saklar .env terbaca sukses!
    };
  });
};

export default app;
