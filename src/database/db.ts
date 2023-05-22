import pg from 'pg';
import { Kysely, PostgresDialect } from 'kysely';
import { Database } from './models';

import 'dotenv/config';

export const db = new Kysely<Database>({
    dialect: new PostgresDialect({
        pool: new pg.Pool({
            connectionString: process.env['DATABASE_URL']
        })
    }),
});

export default db;