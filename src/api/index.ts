import { FastifyPluginAsync } from 'fastify';

import { authPlugin } from './auth';
import { AuthSchema } from '../schema';

export const appRoutes: FastifyPluginAsync = async (app) => {
  app.get('/health', (_, reply) => {
    reply.send({
      message: 'Welcome to MasTour',
      time: new Date().getTime(),
    });
  });

  app.register(authPlugin, {
    prefix: `${AuthSchema.path}`,
    secret: process.env.SECRET ?? '',
    sign: { expiresIn: '12h' },
    saltRounds: +(process.env.SALT_ROUNDS || 12),
  });
};
