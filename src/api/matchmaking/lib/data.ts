import { Kysely, sql } from 'kysely';
import { Categories, Database } from '../../../database';
import { Matchmaking } from '../../../schema';
import { AppResult, Err, Ok, toAppError } from '../../error-handling';
import axios from 'axios';

function euclideanDistance(a: number[], b: number[]) {
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    sum += Math.pow((a[i] ?? 0) - (b[i] ?? 0), 2);
  }
  return Math.sqrt(sum);
}

function normalizeScore(score: number, max: number) {
  return (1 - score / max) * 100;
}

export async function survey(
  db: Kysely<Database>,
  insertRecord: Matchmaking['survey']['body'],
  userId: string
): Promise<AppResult<Matchmaking['survey']['response']>> {
  try {
    const personalityAnswers = {
      instances: [insertRecord.answers],
    };

    const { data: personalityResults } = await axios.post(
      process.env.PERSONALITY_MODEL_URL ?? '',
      personalityAnswers
    );

    const user = await db
      .updateTable('users')
      .where('id', '=', userId)
      .set({
        ...insertRecord,
        personality: personalityResults.predictions[0].indexOf(
          Math.max(...personalityResults.predictions[0])
        ),
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    return Ok({
      data: user,
    });
  } catch (err) {
    return Err(toAppError(err));
  }
}

export async function search(
  db: Kysely<Database>,
  insertRecord: Matchmaking['search']['body'],
  userId: string
): Promise<AppResult<Matchmaking['search']['response']>> {
  try {
    const data = await db.transaction().execute(async (trx) => {
      const user = await trx
        .selectFrom('users')
        .where('id', '=', userId)
        .selectAll()
        .select([
          sql<number>`date_part('year', age(to_timestamp(users.birth_date / 1000)))`.as(
            'age'
          ),
        ])
        .executeTakeFirstOrThrow();

      if (!user.personality) {
        const err = new Error(
          'Personality is wrong because it is not filled yet please fill the survey'
        );
        throw err;
      }

      const pcaBody = [+(user.gender === 'male')];
      if (user.age >= 17 && user.age <= 25) {
        pcaBody.push(...[1, 0, 0, 0, 0]);
      } else if (user.age >= 26 && user.age <= 34) {
        pcaBody.push(...[0, 1, 0, 0, 0]);
      } else if (user.age >= 35 && user.age <= 43) {
        pcaBody.push(...[0, 0, 1, 0, 0]);
      } else if (user.age >= 44 && user.age <= 52) {
        pcaBody.push(...[0, 0, 0, 1, 0]);
      } else {
        pcaBody.push(...[0, 0, 0, 0, 1]);
      }
      pcaBody.push(
        ...insertRecord.categories,
        ...Array(5)
          .fill(null)
          .map((_, i) => {
            return i === (user.personality ?? 0) - 1 ? 1 : 0;
          })
      );

      const { data: pcaResults } = await axios.post(
        process.env.PCA_MODEL_URL ?? '',
        { instances: [pcaBody] }
      );

      const updatedUser = await trx
        .updateTable('users')
        .where('id', '=', userId)
        .set({
          pca: pcaResults.predictions[0],
        })
        .returningAll()
        .executeTakeFirstOrThrow();

      // Find the guides in destination
      const guides = await trx
        .selectFrom('guides')
        .innerJoin('users', 'users.id', 'guides.user_id')
        .where('guides.city_id', '=', insertRecord.city_id)
        .select(['guides.id as id', 'pca'])
        .execute();
      // find the euclidean distance
      const distances: Record<string, number> = {};

      // Calculate distances
      for (const vec of guides) {
        const distance = euclideanDistance(
          updatedUser.pca ?? [],
          vec.pca ?? []
        );
        distances[vec.id] = distance;
      }

      // Find maximum distances
      const maxDistance = Math.max(...Object.values(distances));

      // Normalize distances and store in scores
      const scores: Record<string, number> = {};
      Object.keys(distances).map((row) => {
        scores[row] = normalizeScore(distances[row] ?? 0, maxDistance);
      });

      const sortedScores = Object.keys(scores)
        .map((row) => ({ key: row, value: scores[row] }))
        .sort((a, b) => {
          return (a.value ?? 0) - (b.value ?? 0);
        })
        .slice(-5);

      const matchedGuides = await trx
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
        .where(
          'guides.id',
          'in',
          sortedScores.map((row) => row.key)
        )
        .selectAll('guides')
        .select([
          'guides.id as id',
          'username',
          'users.name as name',
          'users.picture as picture',
          'pca',
          'cities.name as city',
          sql<Categories['select'][]>`categories.categories`.as('categories'),
        ])
        .execute();

      return matchedGuides
        .map((row) => ({
          ...row,
          percentage: scores[row.id] ?? 0,
        }))
        .sort((a, b) => {
          return b.percentage - a.percentage;
        });
    });

    return Ok({
      data,
    });
  } catch (err) {
    return Err(toAppError(err));
  }
}
