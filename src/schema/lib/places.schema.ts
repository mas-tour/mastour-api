import { Type } from '@sinclair/typebox';

import { DbSchema, RecursiveStatic } from '../../database';

export const PlacesSchema = {
  path: '/places',
  readMany: {
    response: Type.Object({
      data: Type.Array(DbSchema['places']),
    }),
  },
};

export type Places = RecursiveStatic<typeof PlacesSchema>;
