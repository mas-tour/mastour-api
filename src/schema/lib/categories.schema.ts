import { Type } from '@sinclair/typebox';

import { DbSchema, RecursiveStatic } from '../../database';

export const CategoriesSchema = {
  path: '/categories',
  readMany: {
    response: Type.Object({
      data: Type.Array(DbSchema['categories']),
    }),
  },
};

export type Categories = RecursiveStatic<typeof CategoriesSchema>;
