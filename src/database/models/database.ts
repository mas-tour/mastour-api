import {
    ColumnType,
    Generated,
    Insertable,
    Selectable,
    Updateable,
} from 'kysely';
import { User } from './user.schema';
import { RecursiveStatic } from './generics';
import { Guide } from './guide.schema';
import { City } from './city.schema';
import { Category } from './category.schema';
import { GuideCategory } from './guide_category.schema';
import { Place } from './place.schema';
import { GuideTopPlace } from './guide_top_places.schema';
import { OrderedGuide } from './ordered_guides.schema';

export interface Database {
    users: UserTable;
    guides: GuideTable;
    cities: CityTable;
    categories: CategoryTable;
    guide_categories: GuideCategoryTable;
    places: PlaceTable;
    guide_top_places: GuideTopPlaceTable;
    ordered_guides: OrderedGuideTable;
}

export const DbSchema = {
    users: User,
    guides: Guide,
    cities: City,
    categories: Category,
    guide_categories: GuideCategory,
    places: Place,
    guide_top_places: GuideTopPlace,
    ordered_guides: OrderedGuide,
};

type Db = RecursiveStatic<typeof DbSchema>;

// Generics

type Modify<T, R> = Omit<T, keyof R> & R;

type DefaultAutoCols = {
    id: Generated<string>;
    created_at: ColumnType<number, number | undefined, never>;
    updated_at: ColumnType<number, number | undefined, number>;
};

type Entity<T> = {
    table: T;
    select: Selectable<T>;
    insert: Insertable<T>;
    update: Updateable<T>;
};

// Tables

type UserTable = Modify<Db['users'], DefaultAutoCols>;
export type Users = Entity<UserTable>;

type GuideTable = Modify<Db['guides'], DefaultAutoCols>;
export type Guides = Entity<GuideTable>;

type CityTable = Modify<Db['cities'], DefaultAutoCols>;
export type Cities = Entity<CityTable>;

type CategoryTable = Modify<Db['categories'], DefaultAutoCols>;
export type Categories = Entity<CategoryTable>;

type GuideCategoryTable = Modify<Db['guide_categories'], DefaultAutoCols>;
export type GuideCategories = Entity<GuideCategoryTable>;

type PlaceTable = Modify<Db['places'], DefaultAutoCols>;
export type Places = Entity<PlaceTable>;

type GuideTopPlaceTable = Modify<Db['guide_top_places'], DefaultAutoCols>;
export type GuideTopPlaces = Entity<GuideTopPlaceTable>;

type OrderedGuideTable = Modify<Db['ordered_guides'], DefaultAutoCols>;
export type OrderedGuides = Entity<OrderedGuideTable>;
