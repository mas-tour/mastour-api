import { Kysely } from 'kysely';
import { Database } from '../../../database';
import { OrderedGuides } from '../../../schema';
import { AppResult, Err, Ok, toAppError } from '../../error-handling';

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
