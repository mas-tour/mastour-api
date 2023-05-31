import { Kysely } from 'kysely';
import { Database } from '../../../database';
import { Matchmaking } from '../../../schema';
import { AppResult, Err, Ok, toAppError } from '../../error-handling';



export async function survey(
  db: Kysely<Database>,
  insertRecord: Matchmaking['survey']['body'],
  userId: string
): Promise<AppResult<Matchmaking['survey']['response']>> {
  try {
    const user = await db.updateTable("users").where("id", "=", userId).set(insertRecord).returningAll().executeTakeFirstOrThrow();

    return Ok({
      data: user
    });
  } catch (err) {
    return Err(toAppError(err));
  }
}
