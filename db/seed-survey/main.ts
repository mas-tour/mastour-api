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
import axios from 'axios';
import * as bcrypt from 'bcrypt';
import fs from 'fs/promises';
import { parse } from 'csv-parse/sync';

import 'dotenv/config';
import path from 'path';

interface SurveyData {
    name: string;
    gender: 'male' | 'female';
    age: { min: number; max: number };
    city: string;
    categories: string[];
    answers: number[];
}

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

        const file = await fs.readFile(path.join(__dirname, 'data.csv'));
        const data: SurveyData[] = parse(file, {
            bom: true,
            cast: (value, context) => {
                if (context.header) return value;
                if (context.column === 'gender') return value.toLowerCase();
                if (context.column === 'age') {
                    const values = value.split('-');
                    return {
                        min: +(values[0] ?? 0),
                        max: +(values[1] ?? 0),
                    };
                }
                if (context.column === 'categories') {
                    const values = value.split(',');
                    return values.map((row) =>
                        row.replace(' tours', '').trim()
                    );
                }
                if (context.column === 'answers') return JSON.parse(value);
                return String(value);
            },
            columns: (header) => {
                return header.map((label: string) => label);
            },
        });

        await initGuides(db, cities, categories, places, data);
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
                    'https://storage.googleapis.com/mastour-bucket/City-pictures/Bandung/Gedung_Sate_Bandung_Jawa_Barat.jpg',
            },
            {
                name: 'Makassar',
                picture:
                    'https://storage.googleapis.com/mastour-bucket/City-pictures/Makassar/Makassar-masjid-99-kubah.jpg',
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
    places: Places['select'][],
    data: SurveyData[]
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

    const citiesRecord: Record<string, string> = {};
    cities.map((row) => {
        citiesRecord[row.name] = row.id;
    });

    const categoriesRecord: Record<string, string> = {};
    categories.map((row) => {
        categoriesRecord[row.name] = row.id;
    });

    const placeIds = places.map((place) => place.id);

    const password = await bcrypt.hash('password', 12);

    await Promise.all(
        data.map(async (row) => {
            return db.transaction().execute(async (trx) => {
                const userData: Users['insert'] = {
                    username: row.name
                        .toLowerCase()
                        .replace(/ /g, '-')
                        .concat(`-${faker.string.uuid()}`),
                    email: `${faker.string.uuid().substring(19)}-${row.name
                        .toLowerCase()
                        .replace(' ', '-')}`,
                    password,
                    name: row.name,
                    phone_number: faker.phone.number('+62#############'),
                    gender: row.gender,
                    birth_date: faker.date
                        .birthdate({ ...row.age, mode: 'age' })
                        .getTime(),
                    picture: faker.image.urlLoremFlickr({
                        category: 'portrait,human,face',
                    }),
                    answers: row.answers,
                    personality: faker.helpers.arrayElement([1, 2, 3, 4, 5]),
                };

                const insertedUser = await trx
                    .insertInto('users')
                    .values(userData)
                    .returningAll()
                    .executeTakeFirstOrThrow();

                const guideData: Guides['insert'] = {
                    user_id: insertedUser.id,
                    city_id: citiesRecord[row.city] ?? '',
                    detail_picture: faker.image.urlLoremFlickr({
                        category: 'portrait,human,face',
                    }),
                    description: faker.lorem.paragraphs(),
                    price_per_day: faker.number.int({
                        min: 50_000,
                        max: 600_000,
                    }),
                };

                const insertedGuide = await trx
                    .insertInto('guides')
                    .values(guideData)
                    .returningAll()
                    .executeTakeFirstOrThrow();

                const pickedPlaces = faker.helpers.arrayElements(placeIds, 3);
                const insertGuideTopPlaces = pickedPlaces.map((innerRow) => ({
                    guide_id: insertedGuide.id,
                    place_id: innerRow,
                }));

                await trx
                    .insertInto('guide_categories')
                    .values(
                        row.categories.map((inRow) => ({
                            guide_id: insertedGuide.id,
                            category_id: categoriesRecord[inRow] ?? '',
                        }))
                    )
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
                                sql`jsonb_agg(categories.name)`.as(
                                    'categories'
                                ),
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
                    .where('users.id', '=', insertedUser.id)
                    .executeTakeFirstOrThrow();

                const personalities = userPersonality.answers;
                const personalityAnswers = {
                    instances: [personalities],
                };

                const {
                    data: {
                        predictions: [personalityResults],
                    },
                } = await axios.post(
                    process.env.PERSONALITY_MODEL_URL ?? '',
                    personalityAnswers
                );

                await trx
                    .updateTable('users')
                    .where('id', '=', insertedUser.id)
                    .set({
                        personality:
                            personalityResults.indexOf(
                                Math.max(...personalityResults)
                            ) + 1,
                    })
                    .execute();
            });
        })
    );

    const inserted = await db
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
                .leftJoin('places', 'places.id', 'guide_top_places.place_id')
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
                'https://storage.googleapis.com/mastour-bucket/Category-pictures/Historical/historical.jpg',
        },
        {
            name: 'Adventure',
            picture:
                'https://storage.googleapis.com/mastour-bucket/Category-pictures/Adventure/adventure.jpg',
        },
        {
            name: 'Nature and Wildlife',
            picture:
                'https://storage.googleapis.com/mastour-bucket/Category-pictures/Nature-and-Wildlife/nature%26wildlife.jpg',
        },
        {
            name: 'Culinary',
            picture:
                'https://storage.googleapis.com/mastour-bucket/Category-pictures/Culinary/culinary.jpg',
        },
        {
            name: 'Wellness and Retreat',
            picture:
                'https://storage.googleapis.com/mastour-bucket/Category-pictures/Wellness-and-Retreat/wellness%26retreat.jpg',
        },
        {
            name: 'Architectural',
            picture:
                'https://storage.googleapis.com/mastour-bucket/Category-pictures/Architectural/architectural.jpg',
        },
        {
            name: 'Educational',
            picture:
                'https://storage.googleapis.com/mastour-bucket/Category-pictures/Educational/educational.jpg',
        },
        {
            name: 'Shopping',
            picture:
                'https://storage.googleapis.com/mastour-bucket/Category-pictures/Shopping/shopping.jpg',
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
                picture: faker.image.urlLoremFlickr({
                    category: 'landmark',
                }),
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
