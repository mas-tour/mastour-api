import { Kysely, sql } from 'kysely';
import { Categories, Database } from '../../../database';
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
  opts: OrderedGuides['readMany']['query']
): Promise<AppResult<OrderedGuides['book']['response']>> {
  try {
    const query = db
    .selectFrom('guides')
    .innerJoin('users', 'users.id', 'guides.user_id')
    .innerJoin('cities', 'cities.id', 'guides.city_id')
    .leftJoin(
      db
        .selectFrom('ordered_guides')
        .leftJoin(
          'ordered_guides',
          'ordered_guides.id',
          'ordered_guides.guide_id' //fix
        )
        .select([
          'ordered_guides.guide_id', // fix
          sql`jsonb_agg(categories.*)`.as('categories'),
        ])
        .groupBy('ordered_guides.guide_id') // check again
        .as('ordered_guides'),
      'guides.id',
      'ordered_guides.guide_id'
    )
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
        sql<Categories['select'][]>`categories.categories`.as('categories'),
      ])
      .orderBy(sql.raw(orderBy), direction)
      .$call((qb) => RM.paginate(qb, opts))
      .execute();

    const paginationResult = await RM.getPaginationInfo(query, opts);
    if (paginationResult.err) return paginationResult;
    const pagination = paginationResult.unwrap();

    return Ok({
      data: guides,
      pagination 
    });
  } catch (err) {
    return Err(toAppError(err));
  }
}
