import { Static, Type } from '@sinclair/typebox';

export const SearchSchema = Type.Object({
  search_by: Type.Optional(Type.String()),
  search_query: Type.Optional(Type.String()),
});
export type Search = Static<typeof SearchSchema>;

export const OrderDirectionSchema = Type.Union([
  Type.Literal('asc'),
  Type.Literal('desc'),
]);
export const OrderSchema = Type.Object({
  order_by: Type.Optional(Type.String()),
  direction: Type.Optional(OrderDirectionSchema),
});
export type Order = Static<typeof OrderSchema>;

export const PaginationSchema = Type.Object({
  size: Type.Number({ minimum: 1 }),
  page: Type.Number({ minimum: 1 }),
});
export type Pagination = Static<typeof PaginationSchema>;

export const PaginationInfoSchema = Type.Object({
  rows: Type.Number({ minimum: 1 }),
  pages: Type.Number({ minimum: 1 }),
});
export type PaginationInfo = Static<typeof PaginationInfoSchema>;

export const ReadManySchema = Type.Intersect([
  SearchSchema,
  OrderSchema,
  PaginationSchema,
]);
export type ReadMany = Search & Order & Pagination;
