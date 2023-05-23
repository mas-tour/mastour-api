import * as T from '../../../tests';
import { faker } from '@faker-js/faker';

describe('Authentication endpoints', () => {
  const db = T.dbConnection();

  beforeAll(async () => {
    await T.checkTestApp();
  });

  afterAll(async () => {
    await db.destroy();
  });

  it('can register and login with correct data', async () => {
    const username = faker.string.uuid().slice(0, 15);
    const email = faker.internet.exampleEmail();
    const registerResponse = await T.request({
      method: 'POST',
      path: '/auth/sign-up',
      data: {
        username,
        email,
        password: 'Greatpass1!',
        name: 'Mas Tour',
        phone_number: '+4532473',
        gender: 'male',
        birth_date: 453467253,
        picture: 'ntaheu',
      },
    });
    expect(registerResponse.status).toBe(201);

    const loginResponse = await T.request({
      method: 'POST',
      path: '/auth/sign-in',
      data: {
        email,
        password: 'Greatpass1!',
      },
    });
    expect(loginResponse.status).toBe(200);
    expect(loginResponse.data).toMatchObject({
      data: {
        id: expect.any(String),
        email,
        username,
        token: expect.any(String),
      },
    });

    const errLoginResponse = await T.request({
      method: 'POST',
      path: '/auth/sign-in',
      data: {
        email,
        password: 'salahnipasswordnya',
      },
    });
    expect(errLoginResponse.status).toBe(401);

    await db
      .deleteFrom('users')
      .where('email', '=', email)
      .executeTakeFirstOrThrow();
  });
});
