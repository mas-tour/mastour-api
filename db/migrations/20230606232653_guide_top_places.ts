import { Kysely, sql } from 'kysely';

const TABLE_NAME = 'guide_top_places';

export async function up(db: Kysely<any>): Promise<void> {
    await db.schema
        .createTable(TABLE_NAME)
        .addColumn('id', 'uuid', (col) =>
            col.primaryKey().defaultTo(sql`gen_random_uuid()`)
        )
        .addColumn('guide_id', 'uuid', (col) =>
            col.notNull().references('guides.id')
        )
        .addColumn('place_id', 'uuid', (col) =>
            col.notNull().references('places.id')
        )
        .addColumn('created_at', 'bigint', (col) =>
            col.defaultTo(sql`EXTRACT(EPOCH FROM NOW()) * 1000`).notNull()
        )
        .addColumn('updated_at', 'bigint', (col) =>
            col.defaultTo(sql`EXTRACT(EPOCH FROM NOW()) * 1000`).notNull()
        )
        .execute();

    await db.schema
        .createIndex(`idx_${TABLE_NAME}_id_guide_id_place_id`)
        .on(TABLE_NAME)
        .columns(['id', 'guide_id', 'place_id'])
        .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
    await db.schema.dropTable(TABLE_NAME).execute();
}
