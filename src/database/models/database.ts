import {
    ColumnType,
    Generated,
    Insertable,
    Selectable,
    Updateable,
} from 'kysely';
import { User } from './user.schema';
import { RecursiveStatic } from './generics';

export interface Database {
    users: UserTable;
}

export const DbSchema = {
    users: User,
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
