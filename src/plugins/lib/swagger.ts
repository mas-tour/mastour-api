import swaggerPlugin, { FastifySwaggerOptions } from '@fastify/swagger';
import { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';

export const swagger: FastifyPluginAsync = fp<FastifySwaggerOptions>(
  async (fastify) => {
    fastify.register(swaggerPlugin, {
      mode: 'dynamic',
      openapi: {
        info: {
          title: 'MasTour API Documentation',
          description: 'MasTour API Documentation',
          version: '1.0.0',
        },
        components: {
          securitySchemes: {
            bearerAuth: {
              type: 'http',
              scheme: 'Bearer',
            },
          },
        },
        security: [
          {
            bearerAuth: [],
          },
        ],
      },
    });
  }
);
