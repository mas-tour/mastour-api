import swaggerUiPlugin, { FastifySwaggerUiOptions } from '@fastify/swagger-ui';
import { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';

export const swaggerUi: FastifyPluginAsync = fp<FastifySwaggerUiOptions>(
  async (fastify) => {
    fastify.register(swaggerUiPlugin, {
      routePrefix: '/docs',
      uiConfig: {
        deepLinking: false,
      },
      staticCSP: true,
      transformStaticCSP: (header) => header,
    });
  }
);
