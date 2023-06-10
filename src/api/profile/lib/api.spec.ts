import * as T from '../../../tests';
import { faker } from '@faker-js/faker';
import * as bcrypt from 'bcrypt';

describe('Profile endpoints', () => {
  const db = T.dbConnection();

  beforeAll(async () => {
    await T.checkTestApp();
  });

  afterAll(async () => {
    await db.destroy();
  });

  it('read profile and update profile', async () => {
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

    const loginResponse = await T.request({
      method: 'POST',
      path: '/auth/sign-in',
      data: {
        email: user.email,
        password: 'password',
      },
    });
    expect(loginResponse.status).toBe(200);
    expect(loginResponse.data).toMatchObject({
      data: {
        id: expect.any(String),
        email: user.email,
        username: user.username,
        token: expect.any(String),
      },
    });

    const token = loginResponse.data.data.token;

    const { password: _, ...userWithoutPassword } = user;
    const getProfileResponse = await T.request({
      method: 'GET',
      path: '/profile',
      token,
    });
    expect(getProfileResponse.status).toBe(200);
    expect(getProfileResponse.data).toMatchObject({
      data: {
        ...userWithoutPassword,
        age: expect.any(Number),
        birth_date: +user.birth_date,
        created_at: +user.created_at,
        updated_at: +user.updated_at,
      },
    });

    const updateProfileResponse = await T.request({
      method: 'PUT',
      path: '/profile',
      data: {
        ...user,
        name: 'New Name',
      },
      token,
    });
    expect(updateProfileResponse.status).toBe(200);
    expect(updateProfileResponse.data).toMatchObject({
      data: {
        ...userWithoutPassword,
        name: 'New Name',
        birth_date: +user.birth_date,
        created_at: +user.created_at,
        updated_at: expect.any(Number),
      },
    });
    expect(updateProfileResponse.data.data.updated_at).toBeGreaterThan(
      updateProfileResponse.data.data.created_at
    );

    const getUpdatedProfileResponse = await T.request({
      method: 'GET',
      path: '/profile',
      token,
    });
    expect(getUpdatedProfileResponse.status).toBe(200);
    expect(getUpdatedProfileResponse.data).toMatchObject({
      data: {
        ...userWithoutPassword,
        name: 'New Name',
        birth_date: +user.birth_date,
        created_at: +user.created_at,
        updated_at: expect.any(Number),
      },
    });
    expect(getUpdatedProfileResponse.data.data.updated_at).toBeGreaterThan(
      getUpdatedProfileResponse.data.data.created_at
    );

    await db
      .deleteFrom('users')
      .where('id', '=', user.id)
      .executeTakeFirstOrThrow();
  });
});
