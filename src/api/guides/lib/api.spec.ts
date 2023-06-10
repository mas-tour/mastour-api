import 'jest-extended';
import * as T from '../../../tests';
import { faker } from '@faker-js/faker';
import * as bcrypt from 'bcrypt';

describe('Guides endpoints', () => {
  const db = T.dbConnection();

  beforeAll(async () => {
    await T.checkTestApp();
  });

  afterAll(async () => {
    await db.destroy();
  });

  it('read guides and guide details', async () => {
    const password = await bcrypt.hash('password', 12);
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const fullName = `${firstName} ${lastName}`;
    const user = await db
      .insertInto('users')
      .values({
        username: fullName
          .toLowerCase()
          .replace(/ /g, '-')
          .concat(`-${faker.string.uuid()}`),
        email: `${faker.string.uuid().substring(19)}-${faker.internet.email({
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
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    const citiesIds = (
      await db.selectFrom('cities').select(['id']).execute()
    ).map((row) => row.id);

    const guide = await db
      .insertInto('guides')
      .values({
        user_id: user.id,
        city_id: faker.helpers.arrayElement(citiesIds),
        detail_picture: faker.image.url(),
        description: faker.lorem.paragraphs(),
        price_per_day: faker.number.int({ min: 50000 }),
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    const categories = await db.selectFrom('categories').selectAll().execute();
    const categoryIds = categories.map((row) => row.id);
    const pickedCategories = faker.helpers.arrayElements(categoryIds, 3);
    const insertGuideCategory = pickedCategories.map((innerRow) => ({
      guide_id: guide.id,
      category_id: innerRow,
    }));

    await db
      .insertInto('guide_categories')
      .values(insertGuideCategory)
      .returningAll()
      .execute();

    const places = await db.selectFrom('places').selectAll().execute();
    const placeIds = places.map((row) => row.id);
    const pickedPlaces = faker.helpers.arrayElements(placeIds, 3);
    const insertGuidePlaces = pickedPlaces.map((innerRow) => ({
      guide_id: guide.id,
      place_id: innerRow,
    }));

    await db
      .insertInto('guide_top_places')
      .values(insertGuidePlaces)
      .returningAll()
      .execute();

    const guideCategories = await db
      .selectFrom('guide_categories')
      .innerJoin('categories', 'categories.id', 'guide_categories.category_id')
      .where('guide_categories.guide_id', '=', guide.id)
      .selectAll('categories')
      .orderBy('categories.name')
      .execute();

    const getAllResponse = await T.request({
      method: 'GET',
      path: '/guides',
      params: {
        size: 10,
        page: 1,
      },
    });
    expect(getAllResponse.status).toBe(200);
    expect(getAllResponse.data.data).toBeInstanceOf(Array);
    expect(getAllResponse.data.data.length).toBeGreaterThan(0);
    expect(getAllResponse.data.data[0].categories).toBeInstanceOf(Array);
    expect(getAllResponse.data.data[0].categories).toMatchObject(
      guideCategories.map((row) => ({
        ...row,
        created_at: +row.created_at,
        updated_at: +row.updated_at,
      }))
    );

    const getCategoryResponse = await T.request({
      method: 'GET',
      path: '/guides',
      params: {
        size: 10,
        page: 1,
        category_id: pickedCategories[0],
      },
    });
    expect(getCategoryResponse.status).toBe(200);
    expect(getCategoryResponse.data.data).toBeInstanceOf(Array);
    expect(getCategoryResponse.data.data.length).toBeGreaterThan(0);
    expect(getCategoryResponse.data.data[0].categories).toBeInstanceOf(Array);
    expect(getCategoryResponse.data.data[0].categories).toMatchObject(
      guideCategories.map((row) => ({
        ...row,
        created_at: +row.created_at,
        updated_at: +row.updated_at,
      }))
    );

    const getOneResponse = await T.request({
      method: 'GET',
      path: '/guides',
      params: {
        size: 1,
        page: 1,
        search_by: 'guides.id',
        search_query: guide.id,
      },
    });
    expect(getOneResponse.status).toBe(200);
    expect(getOneResponse.data.data).toBeInstanceOf(Array);
    expect(getOneResponse.data.data.length).toBe(1);
    expect(getOneResponse.data.data[0]).toMatchObject({
      id: guide.id,
      username: user.username,
      name: user.name,
      picture: user.picture,
      detail_picture: guide.detail_picture,
      description: guide.description,
      price_per_day: +guide.price_per_day,
      city: expect.any(String),
      categories: expect.any(Array),
    });
    expect(getOneResponse.data.data[0].categories).toMatchObject(
      guideCategories.map((row) => ({
        ...row,
        created_at: +row.created_at,
        updated_at: +row.updated_at,
      }))
    );

    const { password: _password, ...userWithoutPassword } = user;
    const getDetailResponse = await T.request({
      method: 'GET',
      path: `/guides/${guide.id}`,
    });
    expect(getDetailResponse.status).toBe(200);
    expect(getDetailResponse.data.data).toMatchObject({
      ...userWithoutPassword,
      ...guide,
      city: expect.any(String),
      id: guide.id,
      categories: expect.any(Array),
      top_places: expect.any(Array),
      price_per_day: +guide.price_per_day,
      birth_date: +user.birth_date,
      created_at: +guide.created_at,
      updated_at: +guide.updated_at,
    });
    expect(getDetailResponse.data.data.categories).toIncludeSameMembers(
      categories
        .filter((row) => pickedCategories.includes(row.id))
        .map((row) => ({
          ...row,
          updated_at: +row.updated_at,
          created_at: +row.created_at,
        }))
    );
    expect(getDetailResponse.data.data.categories).toMatchObject(
      guideCategories.map((row) => ({
        ...row,
        created_at: +row.created_at,
        updated_at: +row.updated_at,
      }))
    );

    await db
      .deleteFrom('guide_top_places')
      .where('guide_id', '=', guide.id)
      .execute();
    await db
      .deleteFrom('guide_categories')
      .where('guide_id', '=', guide.id)
      .execute();
    await db
      .deleteFrom('guides')
      .where('id', '=', guide.id)
      .executeTakeFirstOrThrow();
    await db
      .deleteFrom('users')
      .where('id', '=', user.id)
      .executeTakeFirstOrThrow();
  });
});
