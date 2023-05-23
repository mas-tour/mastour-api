import { Kysely } from 'kysely';
import { Database } from '../../../database';
import { Auth } from '../../../schema';
import { AppResult, Err, Ok, toAppError } from '../../error-handling';
import * as bcrypt from 'bcrypt';
import { JWT } from '../../../plugins';

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

export async function signIn(
  db: Kysely<Database>,
  jwt: JWT,
  insertRecord: Auth['signin']['body']
): Promise<AppResult<Auth['signin']['response']>> {
  try {
    const user = await db
      .selectFrom('users')
      .where('email', '=', insertRecord.email)
      .selectAll()
      .executeTakeFirstOrThrow();

    const passwordMatches = await bcrypt.compare(
      insertRecord.password,
      user.password
    );

    if (!passwordMatches)
      return Err({
        message: 'Gagal masuk!',
        reason: 'Credentials salah',
      });

    const token = jwt.sign({
      id: user.id,
      email: user.email,
      username: user.username,
    });
    return Ok({
      data: {
        id: user.id,
        username: user.username,
        email: user.email,
        token,
      },
    });
  } catch (err) {
    return Err(toAppError(err));
  }
}
