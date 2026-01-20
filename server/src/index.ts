import Fastify from 'fastify';
import cors from '@fastify/cors';
import fastifyStatic from '@fastify/static';
import { Server } from 'socket.io';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import { authRoutes } from './routes/auth.js';
import { consultationRoutes } from './routes/consultation.js';
import { researcherRoutes } from './routes/researcher.js';
import { energyRoutes } from './routes/energy.js';
import { callRoutes } from './routes/call.js';
import { aiRoutes } from './routes/ai.js';
import { favoriteRoutes } from './routes/favorite.js';
import { setupSocket } from './socket/index.js';
import { startTimeoutScheduler } from './services/timeout.js';

dotenv.config();

const prisma = new PrismaClient();

const fastify = Fastify({
  logger: true,
});

// CORS - allow client origin and localhost for development
const allowedOrigins = [
  process.env.CLIENT_URL,
  'http://localhost:5173',
  'http://localhost:3000',
].filter(Boolean) as string[];

await fastify.register(cors, {
  origin: (origin, cb) => {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return cb(null, true);
    // Allow if origin is in our list or contains vercel.app/railway.app
    if (
      allowedOrigins.includes(origin) ||
      origin.includes('.vercel.app') ||
      origin.includes('.railway.app')
    ) {
      return cb(null, true);
    }
    return cb(null, false);
  },
  credentials: true,
});

// Make prisma available
fastify.decorate('prisma', prisma);

// Register routes
fastify.register(authRoutes, { prefix: '/api/auth' });
fastify.register(consultationRoutes, { prefix: '/api/consultation' });
fastify.register(researcherRoutes, { prefix: '/api/researcher' });
fastify.register(energyRoutes, { prefix: '/api/energy' });
fastify.register(callRoutes, { prefix: '/api/call' });
fastify.register(aiRoutes, { prefix: '/api/ai' });
fastify.register(favoriteRoutes, { prefix: '/api/favorite' });

// Health check
fastify.get('/health', async () => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

// Serve static files from client/dist
const clientDistPath = path.join(__dirname, '../../client/dist');
await fastify.register(fastifyStatic, {
  root: clientDistPath,
  prefix: '/',
});

// SPA fallback - serve index.html for non-API routes
fastify.setNotFoundHandler(async (request, reply) => {
  if (request.url.startsWith('/api/')) {
    return reply.status(404).send({ error: 'Not found' });
  }
  return reply.sendFile('index.html');
});

const start = async () => {
  try {
    const port = parseInt(process.env.PORT || '3001');
    const host = process.env.HOST || '0.0.0.0';

    await fastify.listen({ port, host });

    // Setup Socket.IO
    const io = new Server(fastify.server, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST'],
      },
    });

    setupSocket(io, prisma);

    // Make io available globally
    (global as any).io = io;
    (global as any).prisma = prisma;

    // Start timeout scheduler
    startTimeoutScheduler(prisma, io);

    console.log(`🚀 Server running at http://${host}:${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();

// Graceful shutdown
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

// Type augmentation for Fastify
declare module 'fastify' {
  interface FastifyInstance {
    prisma: PrismaClient;
  }
}
