import { Kysely, sql } from 'kysely';
import { Database } from '../../../database';
import { Guides } from '../../../schema';
import { AppResult, Err, Ok, toAppError } from '../../error-handling';
import * as RM from '../../shared/lib/read-many';

export async function readMany(
  db: Kysely<Database>,
  opts: Guides['readMany']['query']
): Promise<AppResult<Guides['readMany']['response']>> {
  try {
    const query = db
      .selectFrom('guides')
      .innerJoin('users', 'users.id', 'guides.user_id')
      .innerJoin('cities', 'cities.id', 'guides.city_id')
      .$if(!!opts.city_id, (qb) => qb.where('city_id', '=', opts.city_id ?? ''))
      .$call((qb) => RM.search(qb, opts));

    const orderBy = opts.order_by ?? 'guides.created_at';
    const direction = opts.direction ?? 'desc';
    const guides = await query
      .selectAll('guides')
      .select([
        'username',
        'users.name as name',
        'users.picture as picture',
        'cities.name as city',
      ])
      .orderBy(sql.raw(orderBy), direction)
      .$call((qb) => RM.paginate(qb, opts))
      .execute();

    const paginationResult = await RM.getPaginationInfo(query, opts);
    if (paginationResult.err) return paginationResult;
    const pagination = paginationResult.unwrap();

    return Ok({
      data: guides,
      pagination,
    });
  } catch (err) {
    return Err(toAppError(err));
  }
}
