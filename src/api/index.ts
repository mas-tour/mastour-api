import { FastifyPluginAsync } from 'fastify';

import { authPlugin } from './auth';
import { matchmakingPlugin } from './matchmaking';
import {
  AuthSchema,
  MatchmakingSchema,
  GuidesSchema,
  CategoriesSchema,
  ProfileSchema,
  CitiesSchema,
} from '../schema';
import { guidesPlugin } from './guides';
import { citiesPlugin } from './cities';
import { profilePlugin } from './profile';
import { categoriesPlugin } from './categories';

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

  app.register(matchmakingPlugin, {
    prefix: `${MatchmakingSchema.path}`,
  });

  app.register(guidesPlugin, {
    prefix: `${GuidesSchema.path}`,
  });

  app.register(citiesPlugin, {
    prefix: `${CitiesSchema.path}`,
  });

  app.register(profilePlugin, {
    prefix: `${ProfileSchema.path}`,
  });

  app.register(categoriesPlugin, {
    prefix: `${CategoriesSchema.path}`,
  });
};
