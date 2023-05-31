import { Type } from '@sinclair/typebox';

import { DbSchema, RecursiveStatic } from '../../database';

export const GuidesSchema = {
  path: '/guides',
  readMany: {
    path: '/',
    response: Type.Object({
      data: Type.Array(DbSchema["guides"]),
    }),
  },
  
};

export type Guides = RecursiveStatic<typeof GuidesSchema>;
