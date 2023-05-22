import * as path from 'path';
import pg from 'pg';
import { promises as fs } from 'fs';
import {
    Kysely,
    Migrator,
    PostgresDialect,
    FileMigrationProvider
} from 'kysely';

import 'dotenv/config';

export async function rollbackAll() {
    interface KyselyMigration {
        name: string;
        timestamp: string;
    }
    interface Database {
        kysely_migration: KyselyMigration;
    }
    const db = new Kysely<Database>({
        dialect: new PostgresDialect({
            pool: new pg.Pool({
                connectionString: process.env['DATABASE_URL']
            })
        }),
    });

    const migrations = await db
        .selectFrom('kysely_migration')
        .selectAll('kysely_migration')
        .execute();

    const migrator = new Migrator({
        db,
        provider: new FileMigrationProvider({
            fs,
            path,
            migrationFolder: path.join(__dirname, 'migrations'),
        }),
    });

    for (let i = 0; i <= migrations.length; i++) {
        const { error, results } = await migrator.migrateDown();
        if (results?.length !== 0) {
            results?.forEach((it) => {
                if (it.status === 'Success') {
                    console.log(
                        `rollback "${it.migrationName}" was executed successfully`
                    );
                } else if (it.status === 'Error') {
                    console.error(`failed to execute rollback "${it.migrationName}"`);
                }
            });
        } else {
            console.log('nothing to rollback');
        }

        if (error) {
            console.error('failed to rollback');
            console.error(error);
            process.exit(1);
        }
    }

    console.log('Rollback completed! Exiting...');
    await db.destroy();
}

rollbackAll();