import fastify from 'fastify';
import { Pool, types } from 'pg';
import * as plugins from './plugins';
import { appRoutes } from './api';

export async function build() {
  const app = await fastify({
    ajv: {
      customOptions: {
        strict: true,
        strictSchema: true,
        removeAdditional: 'all',
        coerceTypes: 'array',
      },
    },
    logger: {
      transport: {
        target: 'pino-pretty',
        options: {
          translateTime: 'HH:MM:ss Z',
          colorize: true,
          ignore: 'pid,hostname',
        },
      },
    },
  });

  async function closeGracefully(signal: string) {
    app.log.info(`*^!@4=> Received signal to terminate: ${signal}`);
    await app.close();
    process.exit();
  }
  process.on('SIGINT', closeGracefully);
  process.on('SIGTERM', closeGracefully);

  // Plugins
  const config = {
    pool: new Pool({ connectionString: process.env.DATABASE_URL }),
  };
  types.setTypeParser(20, Number);
  // Fix intermittent float failures, which are parsed as text.
  // Source: https://github.com/brianc/node-postgres/issues/811#issuecomment-488374261
  types.setTypeParser(1700, parseFloat);
  app.register(plugins.db, config);
  app.register(plugins.cors);
  app.register(plugins.helmet);
  if (process.env.ENV !== 'production') {
    app.register(plugins.swagger);
    app.register(plugins.swaggerUi);
  }

  app.register(appRoutes);
  return app;
}

export default build;
