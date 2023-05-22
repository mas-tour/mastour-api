import corsPlugin, { FastifyCorsOptions } from '@fastify/cors';
import { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';

export const cors: FastifyPluginAsync = fp<FastifyCorsOptions>(
  async (fastify) => {
    fastify.register(corsPlugin, {
      origin: true,
      exposedHeaders: ['content-disposition'],
      credentials: true,
    });
  }
);
