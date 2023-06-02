import { Kysely } from 'kysely';
import { Database } from '../../../database';
import { Profile } from '../../../schema';
import { AppResult, Err, Ok, toAppError } from '../../error-handling';

export async function read(
  db: Kysely<Database>,
  userId: string
): Promise<AppResult<Profile['read']['response']>> {
  try {
    const user = await db
      .selectFrom('users')
      .where('id', '=', userId)
      .selectAll()
      .executeTakeFirstOrThrow();

    const { password: _password, ...userWithoutPassword } = user;

    return Ok({
      data: userWithoutPassword,
    });
  } catch (err) {
    return Err(toAppError(err));
  }
}

export async function update(
  db: Kysely<Database>,
  userId: string,
  insertRecord: Profile['update']['body']
): Promise<AppResult<Profile['update']['response']>> {
  try {
    const user = await db
      .updateTable('users')
      .where('id', '=', userId)
      .set({
        ...insertRecord,
        updated_at: new Date().getTime(),
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    const { password: _password, ...userWithoutPassword } = user;

    return Ok({
      data: userWithoutPassword,
    });
  } catch (err) {
    return Err(toAppError(err));
  }
}
