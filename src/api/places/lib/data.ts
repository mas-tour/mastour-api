import { Kysely } from 'kysely';
import { Database } from '../../../database';
import { Places } from '../../../schema';
import { AppResult, Err, Ok, toAppError } from '../../error-handling';

export async function readMany(
  db: Kysely<Database>
): Promise<AppResult<Places['readMany']['response']>> {
  try {
    const places = await db.selectFrom('places').selectAll().execute();

    return Ok({
      data: places,
    });
  } catch (err) {
    return Err(toAppError(err));
  }
}
