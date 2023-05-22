import { Kysely } from 'kysely';
import { Database } from '../../../database';
import { Auth } from '../../../schema';
import { AppResult, Err, Ok, toAppError } from '../../error-handling';
import * as bcrypt from 'bcrypt';

export async function signUp(
  db: Kysely<Database>,
  insertRecord: Auth['signup']['body'],
  saltRounds: number
): Promise<AppResult<Auth['signup']['response']>> {
  try {
    const password = await bcrypt.hash(insertRecord.password, saltRounds);
    const user = await db
      .insertInto('users')
      .values({
        ...insertRecord,
        password,
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    return Ok({
      data: {
        id: user.id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (err) {
    return Err(toAppError(err));
  }
}
