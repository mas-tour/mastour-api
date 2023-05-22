import swaggerPlugin, { FastifySwaggerOptions } from '@fastify/swagger';
import { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';

export const swagger: FastifyPluginAsync = fp<FastifySwaggerOptions>(
  async (fastify) => {
    fastify.register(swaggerPlugin, {
      mode: 'dynamic',
      swagger: {
        info: {
          title: 'MasTour API Documentation',
          description: 'MasTour API Documentation',
          version: '1.0.0',
        },
        host:
          process.env.ENV == 'production'
            ? process.env.API_URL
            : '127.0.0.1:9000',
        schemes: process.env.ENV == 'production' ? ['https'] : ['http'],
        consumes: ['application/json'],
        produces: ['application/json'],
        definitions: {},
        securityDefinitions: {
          bearerAuth: {
            type: 'apiKey',
            name: 'Authorization',
            in: 'header',
          },
        },
      },
    });
  }
);
