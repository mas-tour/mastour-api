import { Kysely } from 'kysely';
import { Database } from '../../../database';
import { Cities } from '../../../schema';
import { AppResult, Err, Ok, toAppError } from '../../error-handling';

export async function readMany(
  db: Kysely<Database>
): Promise<AppResult<Cities['readMany']['response']>> {
  try {
    const cities = await db.selectFrom('cities').selectAll().execute();

    return Ok({
      data: cities,
    });
  } catch (err) {
    return Err(toAppError(err));
  }
}
