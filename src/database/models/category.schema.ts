import { Type } from '@sinclair/typebox';
import { RecursiveStatic } from './generics';

export const Category = Type.Object({
    id: Type.String({ format: 'uuid' }),
    name: Type.String(),
    slug: Type.String(),
    created_at: Type.Integer(),
    updated_at: Type.Integer(),
});

export type DbCategory = RecursiveStatic<typeof Category>;
