import { Type } from '@sinclair/typebox';
import { RecursiveStatic } from './generics';

export const GuideCategory = Type.Object({
    id: Type.String({ format: 'uuid' }),
    guide_id: Type.String({ format: 'uuid' }),
    category_id: Type.String({ format: 'uuid' }),
    created_at: Type.Integer(),
    updated_at: Type.Integer(),
});

export type DbGuideCategory = RecursiveStatic<typeof GuideCategory>;
