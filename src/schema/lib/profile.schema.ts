import { Type } from '@sinclair/typebox';

import { DbSchema, RecursiveStatic } from '../../database';

export const ProfileSchema = {
  path: '/profile',
  read: {
    response: Type.Object({
      data: Type.Omit(DbSchema['users'], ['password']),
    }),
  },
  update: {
    body: Type.Omit(DbSchema['users'], [
      'id',
      'password',
      'personality',
      'answers',
      'created_at',
      'updated_at',
    ]),
    response: Type.Object({
      data: Type.Omit(DbSchema['users'], ['password']),
    }),
  },
};

export type Profile = RecursiveStatic<typeof ProfileSchema>;
