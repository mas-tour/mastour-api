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

export interface Database {
    users: UserTable;
    guides: GuideTable;
}

export const DbSchema = {
    users: User,
    guides: Guide,
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
