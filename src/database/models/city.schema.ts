import { Type } from '@sinclair/typebox';
import { RecursiveStatic } from './generics';

export const City = Type.Object({
    id: Type.String({ format: 'uuid' }),
    name: Type.String(),
    picture: Type.String(),
    created_at: Type.Integer(),
    updated_at: Type.Integer(),
});

export type DbCity = RecursiveStatic<typeof City>;
