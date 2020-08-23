import { createDbInstance } from '../src/db';

describe('Calling createDbInstance()', () => {
  test('returns an object with the expected properties', async () => {
    const db = await createDbInstance();

    process.emit('exit', 0);

    expect(db).toBeDefined();
    expect(db).toHaveProperty('dbName', 'knck-dev');
    expect(db).toHaveProperty('collectionName', 'shortUrls');
  });
});
