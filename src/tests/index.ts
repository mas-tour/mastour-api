import * as DB from '../database';
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { Kysely, PostgresDialect } from 'kysely';
import { Pool } from 'pg';

export { FastifyInstance } from 'fastify';

require('dotenv').config();

// ---------------------------------------------------------------------------
// Set Up
// ---------------------------------------------------------------------------
export async function request(
  config: AxiosRequestConfig & {
    path?: string;
    token?: string;
  }
): Promise<AxiosResponse> {
  const { headers: headersConfig, ...conf } = config;

  const headers: Record<string, any> = {
    'Content-Type': 'application/json',
    ...headersConfig,
  };

  if (conf.token) {
    headers['Authorization'] = `Bearer ${config.token}`;
  }

  const requestConfig = {
    headers,
    validateStatus: () => true,
    url: `http://0.0.0.0:9000${config.path}`,
    withCredentials: true,
    ...conf,
  };
  return axios(requestConfig)
    .then((x) => x)
    .catch((err) => {
      throw err.toJSON();
    });
}

export async function checkTestApp(): Promise<void> {
  try {
    await request({ url: 'http://0.0.0.0:9000/health' });
  } catch {
    throw Error('API server is off! Please run `pnpm set-up api`!');
  }
}

export type TestDb = Kysely<DB.Database>;

export function dbConnection(): TestDb {
  const connectionString = process.env.DATABASE_URL;
  const pgConfig = { pool: new Pool({ connectionString: connectionString }) };
  const db = new Kysely<DB.Database>({
    dialect: new PostgresDialect(pgConfig),
  });
  return db;
}
