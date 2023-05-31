import { Type } from '@sinclair/typebox';

import { DbSchema, RecursiveStatic } from '../../database';

export const CitiesSchema = {
  path: '/cities',
  readMany: {
    path: '/',
    response: Type.Object({
      data: Type.Array(DbSchema['cities']),
    }),
  },
};

export type Cities = RecursiveStatic<typeof CitiesSchema>;
