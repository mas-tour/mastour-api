import { Type } from '@sinclair/typebox';
import { RecursiveStatic } from './generics';

export const GuideTopPlace = Type.Object({
    id: Type.String({ format: 'uuid' }),
    guide_id: Type.String({ format: 'uuid' }),
    place_id: Type.String({ format: 'uuid' }),
    created_at: Type.Integer(),
    updated_at: Type.Integer(),
});

export type DbGuideTopPlace = RecursiveStatic<typeof GuideTopPlace>;
