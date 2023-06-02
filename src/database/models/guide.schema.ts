import { Type } from '@sinclair/typebox';
import { RecursiveStatic } from './generics';

export const Guide = Type.Object({
    id: Type.String({ format: 'uuid' }),
    user_id: Type.String({ format: 'uuid' }),
    city_id: Type.String({ format: 'uuid' }),
    detail_picture: Type.String(),
    description: Type.String(),
    price_per_day: Type.Integer(),
    created_at: Type.Integer(),
    updated_at: Type.Integer(),
});

export type DbGuide = RecursiveStatic<typeof Guide>;
