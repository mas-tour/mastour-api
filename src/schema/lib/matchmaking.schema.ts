import { Type } from '@sinclair/typebox';

import { DbSchema, RecursiveStatic } from '../../database';

export const MatchmakingSchema = {
  path: '/matchmaking',
  survey: {
    path: '/survey',
    body: Type.Object({
        personality: Type.Array(Type.Integer()),
    }),
    response: Type.Object({
      data: DbSchema["users"],
    }),
  },
  
};

export type Matchmaking = RecursiveStatic<typeof MatchmakingSchema>;
