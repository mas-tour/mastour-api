import { AppResult, Ok, Err, toAppError } from '../../error-handling';
import { Pagination, PaginationInfo, Search } from '../../../schema';
import { RawBuilder, SelectQueryBuilder, sql } from 'kysely';

export function search<DB, TB extends keyof DB, O>(
  query: SelectQueryBuilder<DB, TB, O>,
  opts: Search
): SelectQueryBuilder<DB, TB, O> {
  if (!!opts.search_by && !!opts.search_query) {
    return query.where(
      toSearchExpr(opts.search_by),
      'like',
      toPatternExpr(opts.search_query)
    );
  }
  return query;
}

export function paginate<DB, TB extends keyof DB, O>(
  query: SelectQueryBuilder<DB, TB, O>,
  opts: Pagination
): SelectQueryBuilder<DB, TB, O> {
  return query.offset((opts.page - 1) * opts.size).limit(opts.size);
}

export async function getPaginationInfo<DB, TB extends keyof DB, O>(
  baseQuery: SelectQueryBuilder<DB, TB, O>,
  opts: Pagination
): Promise<AppResult<PaginationInfo>> {
  try {
    const { rows } = await baseQuery
      .select(sql<number>`count(*)`.as('rows'))
      .executeTakeFirstOrThrow();
    return Ok({ rows, pages: Math.ceil(rows / opts.size) });
  } catch (err) {
    return Err(toAppError(err));
  }
}

export function toSearchExpr(searchBy: string): RawBuilder<string> {
  const searchExpr = `LOWER(COALESCE(${searchBy}::text, ''))`;
  return sql<string>`${sql.raw(searchExpr)}`;
}

export function toPatternExpr(searchQuery: string): string {
  return `%${searchQuery}%`.toLowerCase();
}
