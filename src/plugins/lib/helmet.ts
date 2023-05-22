import helmetPlugin, { FastifyHelmetOptions } from '@fastify/helmet';
import { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';

export const helmet: FastifyPluginAsync = fp<FastifyHelmetOptions>(
  async (fastify) => {
    await fastify.register(helmetPlugin, {
      global: true,
      hidePoweredBy: true,
      contentSecurityPolicy: {
        directives: {
          'frame-ancestors': ['none'],
        },
      },
    });
  }
);
