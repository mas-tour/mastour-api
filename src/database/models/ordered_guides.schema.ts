import { Type } from '@sinclair/typebox';
import { RecursiveStatic } from './generics';

export const OrderedGuide = Type.Object({
    id: Type.String({ format: 'uuid' }),
    user_id: Type.String({ format: 'uuid' }),
    guide_id: Type.String({ format: 'uuid' }),
    status: Type.Union([
        Type.Literal('pending'),
        Type.Literal('confirmed'),
        Type.Literal('on_going'),
        Type.Literal('completed'),
    ]),
    start_date: Type.Integer(),
    end_date: Type.Integer(),
    created_at: Type.Integer(),
    updated_at: Type.Integer(),
});

export type DbOrderedGuide = RecursiveStatic<typeof OrderedGuide>;
