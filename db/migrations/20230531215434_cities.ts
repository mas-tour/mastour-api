import { Kysely, sql } from 'kysely';
import { faker } from '@faker-js/faker';

const TABLE_NAME = 'cities';

export async function up(db: Kysely<any>): Promise<void> {
    await db.schema
        .createTable(TABLE_NAME)
        .addColumn('id', 'uuid', (col) =>
            col.primaryKey().defaultTo(sql`gen_random_uuid()`)
        )
        .addColumn('name', 'varchar', (col) => col.notNull().unique())
        .addColumn('picture', 'text', (col) => col.notNull())
        .addColumn('created_at', 'bigint', (col) =>
            col.defaultTo(sql`EXTRACT(EPOCH FROM NOW()) * 1000`).notNull()
        )
        .addColumn('updated_at', 'bigint', (col) =>
            col.defaultTo(sql`EXTRACT(EPOCH FROM NOW()) * 1000`).notNull()
        )
        .execute();

    await db.schema
        .createIndex(`idx_${TABLE_NAME}_id_name`)
        .on(TABLE_NAME)
        .columns(['id', 'name'])
        .execute();

    await db
        .insertInto(TABLE_NAME)
        .values([
            {
                name: 'Bandung',
                picture: faker.image.urlLoremFlickr({ category: 'city' }),
            },
            {
                name: 'Makassar',
                picture: faker.image.urlLoremFlickr({ category: 'city' }),
            },
        ])
        .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
    await db.schema.dropTable(TABLE_NAME).execute();
}
