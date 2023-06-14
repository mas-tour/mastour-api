import { Type } from '@sinclair/typebox';

import { DbSchema, RecursiveStatic } from '../../database';

export const MatchmakingSchema = {
  path: '/matchmaking',
  survey: {
    path: '/survey',
    body: Type.Object({
      answers: Type.Array(Type.Integer(), { minItems: 25, maxItems: 25 }),
    }),
    response: Type.Object({
      data: Type.Omit(DbSchema['users'], ['password']),
    }),
  },
  search: {
    path: '/search',
    body: Type.Object({
      city_id: Type.String({ format: 'uuid' }),
      categories: Type.Array(Type.Integer(), { maxItems: 8 }),
    }),
    response: Type.Object({
      data: Type.Array(
        Type.Intersect([
          Type.Pick(DbSchema['users'], ['username', 'name', 'picture']),
          Type.Pick(DbSchema['guides'], [
            'id',
            'detail_picture',
            'description',
            'price_per_day',
          ]),
          Type.Object({
            city: Type.String(),
            categories: Type.Array(DbSchema['categories']),
            percentage: Type.Number({ maximum: 100 }),
          }),
        ])
      ),
    }),
  },
};

export type Matchmaking = RecursiveStatic<typeof MatchmakingSchema>;
