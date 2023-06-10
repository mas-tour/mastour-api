import { Kysely, sql } from 'kysely';
import { Categories, Database, Places } from '../../../database';
import { Guides } from '../../../schema';
import { AppResult, Err, Ok, toAppError } from '../../error-handling';
import * as RM from '../../shared/lib/read-many';

export async function readMany(
  db: Kysely<Database>,
  opts: Guides['readMany']['query']
): Promise<AppResult<Guides['readMany']['response']>> {
  try {
    //let category: Categories['select'];
    //if (opts && opts.category_id) {
    //category = await db
    //.selectFrom('categories')
    //.where('id', '=', opts.category_id)
    //.selectAll()
    //.executeTakeFirstOrThrow();
    //}
    const query = db
      .selectFrom('guides')
      .innerJoin('users', 'users.id', 'guides.user_id')
      .innerJoin('cities', 'cities.id', 'guides.city_id')
      .leftJoin(
        db
          .selectFrom('guide_categories')
          .leftJoin(
            'categories',
            'categories.id',
            'guide_categories.category_id'
          )
          .select([
            'guide_categories.guide_id',
            sql`jsonb_agg(categories.id)`.as('category_ids'),
            sql`jsonb_agg(categories.* ORDER BY categories.name ASC)`.as(
              'categories'
            ),
          ])
          .groupBy('guide_categories.guide_id')
          .as('categories'),
        'guides.id',
        'categories.guide_id'
      )
      .$if(!!opts.city_id, (qb) => qb.where('city_id', '=', opts.city_id ?? ''))
      .$if(!!opts.category_id, (qb) =>
        qb.where(sql`categories.category_ids`, '?', opts.category_id)
      )
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
      pagination,
    });
  } catch (err) {
    return Err(toAppError(err));
  }
}

export async function read(
  db: Kysely<Database>,
  opts: Guides['read']['params']
): Promise<AppResult<Guides['read']['response']>> {
  try {
    const query = db
      .selectFrom('guides')
      .innerJoin('users', 'users.id', 'guides.user_id')
      .innerJoin('cities', 'cities.id', 'guides.city_id')
      .leftJoin(
        db
          .selectFrom('guide_categories')
          .leftJoin(
            'categories',
            'categories.id',
            'guide_categories.category_id'
          )
          .select([
            'guide_categories.guide_id',
            sql`jsonb_agg(categories.* ORDER BY categories.name ASC)`.as(
              'categories'
            ),
          ])
          .groupBy('guide_categories.guide_id')
          .as('categories'),
        'guides.id',
        'categories.guide_id'
      )
      .leftJoin(
        db
          .selectFrom('guide_top_places')
          .leftJoin('places', 'places.id', 'guide_top_places.place_id')
          .select([
            'guide_top_places.guide_id',
            sql`jsonb_agg(places.* ORDER BY places.name ASC)`.as('top_places'),
          ])
          .groupBy('guide_top_places.guide_id')
          .as('top_places'),
        'guides.id',
        'top_places.guide_id'
      )
      .where('guides.id', '=', opts.id);

    const guides = await query
      .selectAll('guides')
      .select([
        'users.username as username',
        'users.name as name',
        'users.picture as picture',
        'users.email',
        'users.gender',
        'users.answers',
        'users.personality',
        'users.phone_number',
        'users.birth_date',
        'cities.name as city',
        sql<Categories['select'][]>`categories.categories`.as('categories'),
        sql<Places['select'][]>`top_places.top_places`.as('top_places'),
      ])
      .executeTakeFirstOrThrow();

    return Ok({
      data: guides,
    });
  } catch (err) {
    return Err(toAppError(err));
  }
}
