import { Kysely, sql } from 'kysely';

const TABLE_NAME = 'ordered_guides';

export async function up(db: Kysely<any>): Promise<void> {
    await db.schema
        .createTable(TABLE_NAME)
        .addColumn('id', 'uuid', (col) =>
            col.primaryKey().defaultTo(sql`gen_random_uuid()`)
        )
        .addColumn('user_id', 'uuid', (col) =>
            col.notNull().references('users.id')
        )
        .addColumn('guide_id', 'uuid', (col) =>
            col.notNull().references('guides.id')
        )
        .addColumn('status', 'varchar', (col) => col.notNull())
        .addCheckConstraint(
            'status_enum',
            sql`status IN ('pending', 'confirmed', 'on_going', 'completed')`
        )
        .addColumn('start_date', 'bigint', (col) => col.notNull())
        .addColumn('end_date', 'bigint', (col) => col.notNull())
        .addColumn('created_at', 'bigint', (col) =>
            col.defaultTo(sql`EXTRACT(EPOCH FROM NOW()) * 1000`).notNull()
        )
        .addColumn('updated_at', 'bigint', (col) =>
            col.defaultTo(sql`EXTRACT(EPOCH FROM NOW()) * 1000`).notNull()
        )
        .execute();

    await db.schema
        .createIndex(`idx_${TABLE_NAME}_id_user_id_guide_id_status`)
        .on(TABLE_NAME)
        .columns(['id', 'user_id', 'guide_id', 'status'])
        .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
    await db.schema.dropTable(TABLE_NAME).execute();
}
