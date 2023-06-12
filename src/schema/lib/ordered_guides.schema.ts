import { Type } from '@sinclair/typebox';

import { DbSchema, RecursiveStatic } from '../../database';
import { PaginationInfoSchema, ReadManySchema } from './read-many';

export const OrderedGuidesSchema = {
  path: '/ordered_guides',
  book: {
    path: '/book',
    body: Type.Intersect([
      Type.Pick(DbSchema['ordered_guides'], ['start_date', 'end_date']),
    ]),
    params: Type.Object({
      id: Type.String({ format: 'uuid' }),
    }),
    response: Type.Object({
      data: DbSchema['ordered_guides'],
    }),
  },
  readMany: {
    path: '/history',
    query: Type.Intersect([ReadManySchema]),
    response: Type.Object({
      data: Type.Array(
        Type.Intersect([
          DbSchema['users'],
          DbSchema['ordered_guides'],
          Type.Object({
            city: Type.String(),
            count_day: Type.Integer(),
            total_price: Type.Integer(),
            price_per_day: Type.Integer(),
          }),
        ])
      ),
      pagination: PaginationInfoSchema,
    }),
  },
};

// TODO(fatur): Ini type data buat response nanti history
//data: Type.Array(
//Type.Intersect([
//DbSchema['users'],
//DbSchema['ordered_guides'],
//Type.Object({
//city: Type.String(),
//count_day: Type.Integer(),
//total_price: Type.Integer(),
//}),
//])
//),

export type OrderedGuides = RecursiveStatic<typeof OrderedGuidesSchema>;
