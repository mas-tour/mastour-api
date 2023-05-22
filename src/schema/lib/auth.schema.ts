import { Type } from '@sinclair/typebox';

import { DbSchema, RecursiveStatic } from '../../database';

export const AuthSchema = {
  path: '/auth',
  signup: {
    path: '/sign-up',
    body: Type.Intersect([
      Type.Omit(DbSchema['users'], ['id', 'created_at', 'updated_at']),
    ]),
    response: Type.Object({
      data: Type.Pick(DbSchema['users'], ['id', 'username', 'email']),
    }),
  },
};

export type Auth = RecursiveStatic<typeof AuthSchema>;
