import { Kysely, sql } from 'kysely';
import { Database } from '../../../database';
import { OrderedGuides } from '../../../schema';
import { AppResult, Err, Ok, toAppError } from '../../error-handling';
import * as RM from '../../shared/lib/read-many';

export async function book(
  db: Kysely<Database>,
  opts: OrderedGuides['book']['params'],
  body: OrderedGuides['book']['body'],
  user_id: string
): Promise<AppResult<OrderedGuides['book']['response']>> {
  try {
    const result = await db.transaction().execute(async (trx) => {
      const guide = await trx
        .selectFrom('guides')
        .where('id', '=', opts.id)
        .selectAll()
        .executeTakeFirstOrThrow();

      return await trx
        .insertInto('ordered_guides')
        .values({
          ...body,
          user_id,
          guide_id: guide.id,
          status: 'pending',
        })
        .returningAll()
        .executeTakeFirstOrThrow();
    });

    return Ok({
      data: result,
    });
  } catch (err) {
    return Err(toAppError(err));
  }
}

//fix
export async function readMany(
  db: Kysely<Database>,
  opts: OrderedGuides['readMany']['query'],
  user_id: string
): Promise<AppResult<OrderedGuides['readMany']['response']>> {
  try {
    const query = db
      .selectFrom('ordered_guides')
      .innerJoin('guides', 'guides.id', 'ordered_guides.guide_id')
      .innerJoin('users', 'users.id', 'guides.user_id')
      .innerJoin('cities', 'cities.id', 'guides.city_id')
      .where('ordered_guides.user_id', '=', user_id)
      .$call((qb) => RM.search(qb, opts));

    const orderBy = opts.order_by ?? 'ordered_guides.created_at';
    const direction = opts.direction ?? 'desc';
    const guides = await query
      .selectAll('ordered_guides')
      .selectAll('users')
      .select([
        'ordered_guides.id as id',
        'ordered_guides.user_id as user_id',
        'ordered_guides.guide_id as guide_id',
        'ordered_guides.status as status',
        'ordered_guides.start_date as start_date',
        'ordered_guides.end_date as end_date',
        'guides.price_per_day',
        'users.name as name',
        'users.picture as picture',
        'cities.name as city',
        sql<number>`date_part('day', to_timestamp(ordered_guides.end_date / 1000) - to_timestamp(ordered_guides.start_date / 1000))`.as(
          'count_day'
        ),
        sql<number>`guides.price_per_day * (date_part('day', (to_timestamp(ordered_guides.end_date / 1000) - to_timestamp(ordered_guides.start_date / 1000))))`.as(
          'total_price'
        ),
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
