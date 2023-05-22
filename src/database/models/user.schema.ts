import { Type } from '@sinclair/typebox';
import { RecursiveStatic, Nullable } from './generics';

export const User = Type.Object({
    id: Type.String({ format: 'uuid' }),
    username: Type.String(),
    email: Type.String({ format: 'email' }),
    password: Type.String(),
    name: Type.String(),
    phone_number: Type.String(),
    gender: Type.Union([Type.Literal('male'), Type.Literal('female')]),
    birth_date: Type.Integer(),
    picture: Nullable(Type.String()),
    created_at: Type.Integer(),
    updated_at: Type.Integer(),
});

export type DbUser = RecursiveStatic<typeof User>;
