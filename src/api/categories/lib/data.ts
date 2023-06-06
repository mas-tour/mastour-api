import { Kysely } from 'kysely';
import { Database } from '../../../database';
import { Categories } from '../../../schema';
import { AppResult, Err, Ok, toAppError } from '../../error-handling';

export async function readMany(
  db: Kysely<Database>
): Promise<AppResult<Categories['readMany']['response']>> {
  try {
    const categories = await db.selectFrom('categories').selectAll().execute();

    return Ok({
      data: categories,
    });
  } catch (err) {
    return Err(toAppError(err));
  }
}
