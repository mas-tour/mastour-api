import {
    Database,
    Cities,
    Users,
    Guides,
    Categories,
} from '../../src/database';
import { Kysely, PostgresDialect, sql } from 'kysely';
import { Pool } from 'pg';
import { faker } from '@faker-js/faker';
import * as bcrypt from 'bcrypt';

import 'dotenv/config';

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
        await initGuides(db, cities, categories);
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
                picture: faker.image.urlLoremFlickr({ category: 'city' }),
            },
            {
                name: 'Makassar',
                picture: faker.image.urlLoremFlickr({ category: 'city' }),
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
    categories: Categories['select'][]
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
                price_per_day: faker.number.int({ min: 50000 }),
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

        await trx
            .insertInto('guide_categories')
            .values(insertGuideCategory)
            .returningAll()
            .execute();

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
        'Historical',
        'Adventure',
        'Nature and Wildlife',
        'Culinary',
        'Wellness and Retreat',
        'Architectural',
        'Educational',
        'Shopping',
    ];

    const inserted = await db
        .insertInto('categories')
        .values(
            categories.map(
                (row) =>
                    ({
                        name: row,
                        slug: row.toLowerCase().replace(/ /g, '-'),
                    } as Categories['insert'])
            )
        )
        .returningAll()
        .execute();
    console.log(`Inserted ${inserted.length} categories data!`);
    return inserted;
}
