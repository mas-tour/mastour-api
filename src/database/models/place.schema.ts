import { Type } from '@sinclair/typebox';
import { RecursiveStatic, Nullable } from './generics';

export const Place = Type.Object({
    id: Type.String({ format: 'uuid' }),
    name: Type.String(),
    picture: Nullable(Type.String()),
    created_at: Type.Integer(),
    updated_at: Type.Integer(),
});

export type DbPlace = RecursiveStatic<typeof Place>;
