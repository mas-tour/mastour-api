import swaggerUiPlugin, { FastifySwaggerUiOptions } from '@fastify/swagger-ui';
import { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';

export const swaggerUi: FastifyPluginAsync = fp<FastifySwaggerUiOptions>(
  async (fastify) => {
    fastify.register(swaggerUiPlugin, {
      routePrefix: '/docs',
      initOAuth: {},
      uiConfig: {
        deepLinking: false,
        displayRequestDuration: true,
      },
      staticCSP: true,
      transformStaticCSP: (header) => header,
    });
  }
);
