import { Type } from '@sinclair/typebox';

import { DbSchema, RecursiveStatic } from '../../database';

export const AuthSchema = {
  path: '/auth',
  signup: {
    path: '/sign-up',
    body: Type.Intersect([
      Type.Omit(DbSchema['users'], ['id', 'created_at', 'updated_at', 'personality']),
    ]),
    response: Type.Object({
      data: Type.Pick(DbSchema['users'], ['id', 'username', 'email']),
    }),
  },
  signin: {
    path: '/sign-in',
    body: Type.Intersect([Type.Pick(DbSchema['users'], ['email', 'password'])]),
    response: Type.Object({
      data: Type.Intersect([
        Type.Pick(DbSchema['users'], ['id', 'username', 'email']),
        Type.Object({
          token: Type.String(),
        }),
      ]),
    }),
  },
};

export type Auth = RecursiveStatic<typeof AuthSchema>;
