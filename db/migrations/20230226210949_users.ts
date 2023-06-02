import { Kysely, sql } from 'kysely';

const TABLE_NAME = 'users';

export async function up(db: Kysely<any>): Promise<void> {
    await db.schema
        .createTable(TABLE_NAME)
        .addColumn('id', 'uuid', (col) =>
            col.primaryKey().defaultTo(sql`gen_random_uuid()`)
        )
        .addColumn('username', 'varchar', (col) => col.notNull().unique())
        .addColumn('email', 'varchar', (col) => col.notNull().unique())
        .addColumn('password', 'text', (col) => col.notNull())
        .addColumn('name', 'varchar', (col) => col.notNull())
        .addColumn('phone_number', 'varchar', (col) => col.notNull())
        .addColumn('gender', 'varchar', (col) => col.notNull())
        .addCheckConstraint('gender_enum', sql`gender IN ('male', 'female')`)
        .addColumn('birth_date', 'bigint', (col) => col.notNull())
        .addColumn('picture', 'text')
        .addColumn('answers', sql`integer[25]`)
        .addColumn('personality', 'integer')
        .addColumn('created_at', 'bigint', (col) =>
            col.defaultTo(sql`EXTRACT(EPOCH FROM NOW()) * 1000`).notNull()
        )
        .addColumn('updated_at', 'bigint', (col) =>
            col.defaultTo(sql`EXTRACT(EPOCH FROM NOW()) * 1000`).notNull()
        )
        .execute();

    await db.schema
        .createIndex(`idx_${TABLE_NAME}_id_username_email`)
        .on(TABLE_NAME)
        .columns(['id', 'username', 'email'])
        .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
    await db.schema.dropTable(TABLE_NAME).execute();
}
