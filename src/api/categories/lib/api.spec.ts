import * as T from '../../../tests';

describe('Categories endpoints', () => {
  const db = T.dbConnection();

  beforeAll(async () => {
    await T.checkTestApp();
  });

  afterAll(async () => {
    await db.destroy();
  });

  it('read guides and guide details', async () => {
    const getAllResponse = await T.request({
      method: 'GET',
      path: '/categories',
    });
    expect(getAllResponse.status).toBe(200);
    expect(getAllResponse.data.data).toBeInstanceOf(Array);
    expect(getAllResponse.data.data.length).toBeGreaterThan(0);
  });
});
