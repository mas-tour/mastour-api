import { Kysely } from 'kysely';
import { Database } from '../../../database';
import { Guides } from '../../../schema';
import { AppResult, Err, Ok, toAppError } from '../../error-handling';



export async function readMany(
  db: Kysely<Database>,
): Promise<AppResult<Guides['readMany']['response']>> {
  try {
    const guides = await db.selectFrom("guides").selectAll().execute();

    return Ok({
      data: guides
    });
  } catch (err) {
    return Err(toAppError(err));
  }
}
