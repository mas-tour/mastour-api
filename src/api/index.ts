import { FastifyPluginAsync } from 'fastify';

import { authPlugin } from './auth';
import { matchmakingPlugin } from './matchmaking';
import {
  AuthSchema,
  CategoriesSchema,
  CitiesSchema,
  PlacesSchema,
} from '../schema';
import { guidesPlugin } from './guides';
import { citiesPlugin } from './cities';
import { profilePlugin } from './profile';
import { categoriesPlugin } from './categories';
import { placesPlugin } from './places';
import { orderedGuidesPlugin } from './ordered_guides';

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
    sign: {},
    saltRounds: +(process.env.SALT_ROUNDS || 12),
  });

  app.register(matchmakingPlugin);

  app.register(guidesPlugin);

  app.register(citiesPlugin, {
    prefix: `${CitiesSchema.path}`,
  });

  app.register(profilePlugin);

  app.register(categoriesPlugin, {
    prefix: `${CategoriesSchema.path}`,
  });

  app.register(placesPlugin, {
    prefix: `${PlacesSchema.path}`,
  });

  app.register(orderedGuidesPlugin);
};
