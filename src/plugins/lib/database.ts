import { Database } from '../../database'
import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import { Kysely, PostgresDialect, PostgresDialectConfig, sql } from 'kysely';

declare module 'fastify' {
  interface FastifyInstance {
    db: Kysely<Database>;
  }
}

export const db: FastifyPluginAsync<PostgresDialectConfig> = fp(
  async (fastify: FastifyInstance, config: PostgresDialectConfig) => {
    const db = new Kysely<Database>({ dialect: new PostgresDialect(config) });
    await sql`select 1`
      .execute(db)
      .then(() => {
        fastify.log.info('Database connected');
      })
      .catch((e) => {
        fastify.log.error(e);
        process.kill(process.pid, 'SIGINT');
      });
    fastify.decorate('db', db);

    fastify.addHook('onClose', async () => {
      await db.destroy();
    });
  }
);
