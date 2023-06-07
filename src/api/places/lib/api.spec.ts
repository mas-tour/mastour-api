import * as T from '../../../tests';

describe('Places endpoints', () => {
  const db = T.dbConnection();

  beforeAll(async () => {
    await T.checkTestApp();
  });

  afterAll(async () => {
    await db.destroy();
  });

  it('read places and place details', async () => {
    const getAllResponse = await T.request({
      method: 'GET',
      path: '/places',
    });
    expect(getAllResponse.status).toBe(200);
    expect(getAllResponse.data.data).toBeInstanceOf(Array);
    expect(getAllResponse.data.data.length).toBeGreaterThan(0);
  });
});
