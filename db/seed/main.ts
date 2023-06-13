import {
    Database,
    Cities,
    Users,
    Guides,
    Categories,
    Places,
} from '../../src/database';
import { Kysely, PostgresDialect, sql } from 'kysely';
import { Pool } from 'pg';
import { faker } from '@faker-js/faker';
import * as bcrypt from 'bcrypt';

import 'dotenv/config';
import axios from 'axios';

async function initSeedData(): Promise<void> {
    const db = new Kysely<Database>({
        dialect: new PostgresDialect({
            pool: new Pool({ connectionString: process.env.DATABASE_URL }),
        }),
    });

    console.info('Initialize seed data...');
    try {
        const cities = await initCities(db);
        const categories = await initCategories(db);
        const places = await initPlaces(db);
        await initGuides(db, cities, categories, places);
        console.info(
            'Seed data initialized successfully. Exit seeding process...'
        );
        await db.destroy();
    } catch (error: unknown) {
        await db.destroy();
        console.info('An error occurred when seeding data! Abort mission...');
        if (error instanceof Error) {
            throw error;
        } else {
            throw new Error(`${error}`);
        }
    }
}

initSeedData();

async function countRows(
    db: Kysely<Database>,
    table: keyof Database
): Promise<number> {
    const { count } = await db
        .selectFrom(table)
        .select(sql<number>`count(*)`.as('count'))
        .executeTakeFirstOrThrow();
    return count;
}

async function initCities(db: Kysely<Database>) {
    console.log('Inserting cities data...');
    const countCities = await countRows(db, 'cities');
    if (countCities > 0) {
        console.log('Cities data already exist!');
        return await db.selectFrom('cities').selectAll().execute();
    }
    const inserted = await db
        .insertInto('cities')
        .values([
            {
                name: 'Bandung',
                picture:
                    'https://storage.googleapis.com/mastourbucket-test/city-picture/Bandung/Gedung_Sate',
            },
            {
                name: 'Makassar',
                picture:
                    'https://storage.googleapis.com/mastourbucket-test/city-picture/Makassar/Pantai_Losari.jpg',
            },
        ])
        .returningAll()
        .execute();
    console.log(`Inserted ${inserted.length} cities data!`);
    return inserted;
}

async function initGuides(
    db: Kysely<Database>,
    cities: Cities['select'][],
    categories: Categories['select'][],
    places: Places['select'][]
) {
    console.log('Inserting guides data...');
    const countGuides = await countRows(db, 'guides');
    if (countGuides > 0) {
        console.log('Guides data already exist!');
        return await db
            .selectFrom('users')
            .innerJoin('guides', 'guides.user_id', 'users.id')
            .innerJoin('cities', 'cities.id', 'guides.city_id')
            .selectAll()
            .execute();
    }

    const inserted = await db.transaction().execute(async (trx) => {
        const password = await bcrypt.hash('password', 12);
        const users = Array(50)
            .fill(null)
            .map(() => {
                const firstName = faker.person.firstName();
                const lastName = faker.person.lastName();
                const fullName = `${firstName} ${lastName}`;
                return {
                    username: fullName
                        .toLowerCase()
                        .replace(/ /g, '-')
                        .concat(`-${faker.string.uuid()}`),
                    email: `${faker.string
                        .uuid()
                        .substring(19)}-${faker.internet.email({
                        firstName,
                        lastName,
                    })}`,
                    password,
                    name: fullName,
                    phone_number: faker.phone.number('+62#############'),
                    gender: faker.helpers.arrayElement(['male', 'female']),
                    birth_date: faker.date
                        .birthdate({ min: 1971, max: 2010, mode: 'year' })
                        .getTime(),
                    picture: faker.image.url(),
                    answers: faker.helpers.multiple(
                        () => faker.helpers.arrayElement([1, 2, 3, 4, 5]),
                        { count: 25 }
                    ),
                    personality: faker.helpers.arrayElement([1, 2, 3, 4, 5]),
                } as Users['insert'];
            });
        const insertedUsers = await trx
            .insertInto('users')
            .values(users)
            .returningAll()
            .execute();

        const citiesIds = cities.map((row) => row.id);
        const guides = insertedUsers.map((row) => {
            return {
                user_id: row.id,
                city_id: faker.helpers.arrayElement(citiesIds),
                detail_picture: faker.image.url(),
                description: faker.lorem.paragraphs(),
                price_per_day: faker.number.int({ min: 50_000, max: 600_000 }),
            } as Guides['insert'];
        });
        const insertedGuides = await trx
            .insertInto('guides')
            .values(guides)
            .returningAll()
            .execute();

        const categoryIds = categories.map((category) => category.id);
        const insertGuideCategory = insertedGuides
            .map((row) => {
                const pickedCategories = faker.helpers.arrayElements(
                    categoryIds,
                    3
                );

                return pickedCategories.map((innerRow) => ({
                    guide_id: row.id,
                    category_id: innerRow,
                }));
            })
            .flat();

        const placeIds = places.map((place) => place.id);
        const insertGuideTopPlaces = insertedGuides
            .map((row) => {
                const pickedPlaces = faker.helpers.arrayElements(placeIds, 3);

                return pickedPlaces.map((innerRow) => ({
                    guide_id: row.id,
                    place_id: innerRow,
                }));
            })
            .flat();

        await trx
            .insertInto('guide_categories')
            .values(insertGuideCategory)
            .returningAll()
            .execute();

        await trx
            .insertInto('guide_top_places')
            .values(insertGuideTopPlaces)
            .returningAll()
            .execute();

        const userPersonality = await trx
            .selectFrom('users')
            .innerJoin('guides', 'guides.user_id', 'users.id')
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
                        sql`jsonb_agg(categories.name)`.as('categories'),
                    ])
                    .groupBy('guide_categories.guide_id')
                    .as('categories'),
                'guides.id',
                'categories.guide_id'
            )
            .selectAll()
            .select([
                'users.id as id',
                sql<number>`date_part('year', age(to_timestamp(users.birth_date / 1000)))`.as(
                    'age'
                ),
                sql<string[]>`categories.categories`.as('categories'),
            ])
            .execute();

        const personalities = userPersonality.map((row) => row.answers);
        const personalityAnswers = {
            instances: personalities,
        };

        const {
            data: { predictions: personalityResults },
        } = await axios.post(
            process.env.PERSONALITY_MODEL_URL ?? '',
            personalityAnswers
        );
        const updateBody = userPersonality.map((row, i) => {
            return {
                ...row,
                personality: personalityResults[i].indexOf(
                    Math.max(...personalityResults[i])
                ),
            };
        });

        const categoriesList = [
            'Historical',
            'Adventure',
            'Nature and Wildlife',
            'Culinary',
            'Wellness and Retreat',
            'Architectural',
            'Educational',
            'Shopping',
        ];

        const pcaBody: number[][] = [];
        userPersonality.map((user, i) => {
            const pcaBodyUser = [+(user.gender === 'male')];
            if (user.age >= 17 && user.age <= 25) {
                pcaBodyUser.push(...[1, 0, 0, 0, 0]);
            } else if (user.age >= 26 && user.age <= 34) {
                pcaBodyUser.push(...[0, 1, 0, 0, 0]);
            } else if (user.age >= 35 && user.age <= 43) {
                pcaBodyUser.push(...[0, 0, 1, 0, 0]);
            } else if (user.age >= 44 && user.age <= 52) {
                pcaBodyUser.push(...[0, 0, 0, 1, 0]);
            } else {
                pcaBodyUser.push(...[0, 0, 0, 0, 1]);
            }
            pcaBodyUser.push(
                ...categoriesList.map((row) =>
                    user.categories.includes(row) ? 1 : 0
                ),
                ...Array(5)
                    .fill(null)
                    .map((_, j) => {
                        return j === (updateBody[i]?.personality ?? 0) - 1
                            ? 1
                            : 0;
                    })
            );
            pcaBody.push(pcaBodyUser);
        });

        updateBody.map(async (row) => {
            await trx
                .updateTable('users')
                .where('id', '=', row.id)
                .set({
                    personality: row.personality,
                })
                .execute();
        });

        return await trx
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
                        sql`jsonb_agg(categories.*)`.as('categories'),
                    ])
                    .groupBy('guide_categories.guide_id')
                    .as('categories'),
                'guides.id',
                'categories.guide_id'
            )
            .leftJoin(
                db
                    .selectFrom('guide_top_places')
                    .leftJoin(
                        'places',
                        'places.id',
                        'guide_top_places.place_id'
                    )
                    .select([
                        'guide_top_places.guide_id',
                        sql`jsonb_agg(places.*)`.as('places'),
                    ])
                    .groupBy('guide_top_places.guide_id')
                    .as('places'),
                'guides.id',
                'places.guide_id'
            )
            .selectAll()
            .execute();
    });

    console.log(`Inserted ${inserted.length} guides data!`);
    return inserted;
}

async function initCategories(db: Kysely<Database>) {
    console.log('Inserting categories data...');
    const countCategories = await countRows(db, 'categories');
    if (countCategories > 0) {
        console.log('Categories data already exist!');
        return await db.selectFrom('categories').selectAll().execute();
    }

    const categories = [
        {
            name: 'Historical',
            picture:
                'https://storage.googleapis.com/mastourbucket-test/category-pictures/historical/historical.jpg',
        },
        {
            name: 'Adventure',
            picture:
                'https://storage.googleapis.com/mastourbucket-test/category-pictures/adventure/adventure.jpg',
        },
        {
            name: 'Nature and Wildlife',
            picture:
                'https://storage.googleapis.com/mastourbucket-test/category-pictures/Nature%26Wildlife/nature%26wildlife.jpg',
        },
        {
            name: 'Culinary',
            picture:
                'https://storage.googleapis.com/mastourbucket-test/category-pictures/culinary/culinaryjpg',
        },
        {
            name: 'Wellness and Retreat',
            picture:
                'https://storage.googleapis.com/mastourbucket-test/category-pictures/wellness%26retreat/wellness%26retreat2.jpg',
        },
        {
            name: 'Architectural',
            picture:
                'https://storage.googleapis.com/mastourbucket-test/category-pictures/architectural/architectural.jpg',
        },
        {
            name: 'Educational',
            picture:
                'https://storage.googleapis.com/mastourbucket-test/category-pictures/educational/educational.jpg',
        },
        {
            name: 'Shopping',
            picture:
                'https://storage.googleapis.com/mastourbucket-test/category-pictures/shopping/shopping.jpg',
        },
    ];

    const inserted = await db
        .insertInto('categories')
        .values(
            categories.map(
                (row) =>
                    ({
                        name: row.name,
                        slug: row.name.toLowerCase().replace(/ /g, '-'),
                        picture: row.picture,
                    } as Categories['insert'])
            )
        )
        .returningAll()
        .execute();
    console.log(`Inserted ${inserted.length} categories data!`);
    return inserted;
}

async function initPlaces(db: Kysely<Database>) {
    console.log('Inserting places data...');
    const countPlaces = await countRows(db, 'places');
    if (countPlaces > 0) {
        console.log('Places data already exist!');
        return await db.selectFrom('places').selectAll().execute();
    }

    const places = Array(6)
        .fill(null)
        .map(() => {
            return {
                name: faker.location.street(),
                picture: faker.image.url(),
            } as Places['insert'];
        });

    const inserted = await db
        .insertInto('places')
        .values(places)
        .returningAll()
        .execute();
    console.log(`Inserted ${inserted.length} places data!`);
    return inserted;
}
