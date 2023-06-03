import { Type } from '@sinclair/typebox';

import { DbSchema, RecursiveStatic } from '../../database';
import { PaginationInfoSchema, ReadManySchema } from './read-many';

export const GuidesSchema = {
  path: '/guides',
  readMany: {
    query: Type.Intersect([
      ReadManySchema,
      Type.Object({
        city_id: Type.Optional(Type.String({ format: 'uuid' })),
      }),
    ]),
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
          }),
        ])
      ),
      pagination: PaginationInfoSchema,
    }),
  },
};

export type Guides = RecursiveStatic<typeof GuidesSchema>;
