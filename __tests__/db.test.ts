import { createClient } from '../src/db';

const TTL = 9999;

const mockConsoleError = jest
  .spyOn(console, 'error')
  .mockImplementation(() => { });

const mockProcessExit = jest
  .spyOn(process, 'exit')
  .mockImplementation(() => undefined as never);

afterAll(() => {
  mockConsoleError.mockRestore();
  mockProcessExit.mockRestore();
});

/**
 * createClient()
 */

describe('createClient()', () => {
  describe('with an existing table name', () => {
    test('returns an object with the expected methods', async () => {
      const db = await createClient('mockTable', TTL);
      expect(db).toHaveProperty('put');
      expect(typeof db.put).toBe('function');
      expect(db).toHaveProperty('get');
      expect(typeof db.get).toBe('function');
    });
  });

  describe('with a non-existing table name', () => {
    test('returns an object with the expected methods', async () => {
      const db = await createClient('doesNotExist', TTL);
      expect(db).toHaveProperty('put');
      expect(typeof db.put).toBe('function');
      expect(db).toHaveProperty('get');
      expect(typeof db.get).toBe('function');
    });
  });
});

/**
 * client.get()
 */

describe('client.get()', () => {
  describe('when passed an existing URL ID', () => {
    test('returns an object with the expected properties', async () => {
      const client = await createClient('mockTable', TTL);
      const result = await client.get('f6G32a');
      expect(typeof result).toBe('object');
      expect(result).toHaveProperty('urlId', 'f6G32a');
      expect(result).toHaveProperty('url', 'https://www.example.com/');
    });
  });

  describe('when passed a non-existing URL ID', () => {
    test('returns undefined', async () => {
      const client = await createClient('mockTable', TTL);
      const result = await client.get('aaaaaa');
      expect(result).toBeUndefined();
    });
  });
});

/**
 * client.put()
 */

describe('client.put()', () => {
  describe('when passed params containing a valid URL ID and URL', () => {
    test('resolves to be true', async () => {
      const client = await createClient('mockTable', TTL);
      const promise = client.put({
        urlId: 'fsGf2Q',
        url: 'https://www.example.com/',
      });
      expect(promise).resolves.toBe(true);
    });
  });

  describe('when passed params containing an existing URL ID', () => {
    test('resolves to be false', async () => {
      const client = await createClient('mockTable', TTL);
      const promise = client.put({
        urlId: 'f6G32a',
        url: 'https://www.example.com/',
      });
      expect(promise).resolves.toBe(false);
    });
  });

  describe('when passed an empty params object', () => {
    test('resolves to be false', async () => {
      const client = await createClient('mockTable', TTL);
      //@ts-expect-error
      const promise = client.put({});
      expect(promise).resolves.toBe(false);
    });
  });

  describe('when the mock error is triggered', () => {
    test('rejects with an error', async () => {
      const client = await createClient('mockTable', TTL);
      const promise = client.put({
        urlId: 'trigger_mock_error',
        url: 'https://www.example.com/',
      });
      expect(promise).rejects.toThrow(Error('mock error'));
    });
  });

  describe('when the empty response is triggered', () => {
    test('resolves to be false', async () => {
      const client = await createClient('mockTable', TTL);
      const promise = client.put({
        urlId: 'trigger_empty_response',
        url: 'https://www.example.com/',
      });
      expect(promise).resolves.toBe(false);
    });
  });
});
