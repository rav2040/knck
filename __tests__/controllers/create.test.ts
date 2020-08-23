import type { TuftContext } from 'tuft';

import { createShortUrl } from '../../src/controllers/create';
import { badRequestResponse, serverErrorResponse } from '../../src/error-responses';

const MOCK_HOST = 'localhost:3000';
const MOCK_URL = 'https://www.example.com';
const MOCK_URL_INVALID = 'https://www.example.com/invalid';
const MOCK_URL_ERROR = 'https://www.example.com/error';

const mockDb = {
  findOne: jest.fn(),
  insertOne: jest.fn(async document => {
    if (document.url === MOCK_URL_ERROR) {
      throw Error('mock error');
    }

    return {
      insertedCount: document.url === MOCK_URL_INVALID ? 0 : 1,
    };
  }),
};

const mockConsoleError = jest
  .spyOn(console, 'error')
  .mockImplementation(() => { });

beforeEach(() => {
  mockDb.findOne.mockClear();
  mockDb.insertOne.mockClear();
  mockConsoleError.mockClear();
});

afterAll(() => {
  mockConsoleError.mockRestore();
});

describe('When passed a context with an existing url', () => {
  test('returns an object containing the original URL and a valid short URL', async () => {
    const mockTuftContext = {
      request: {
        headers: { host: MOCK_HOST },
        searchParams: new Map([['url', MOCK_URL]]),
      },
    } as unknown as TuftContext;

    const result = await createShortUrl(
      //@ts-expect-error
      mockDb,
      mockTuftContext,
    );

    expect(result).toBeDefined();
    expect(result).toHaveProperty('json');
    //@ts-expect-error
    expect(result.json).toHaveProperty('originalUrl', MOCK_URL);
    //@ts-expect-error
    expect(result.json).toHaveProperty('shortUrl');
    //@ts-expect-error
    expect(result.json.shortUrl.startsWith('http://' + MOCK_HOST));
    expect(mockDb.findOne).toHaveBeenCalled();
    expect(mockDb.insertOne).toHaveBeenCalled();
  });
});

describe('When passed a context with an invalid url', () => {
  test('returns an object containing the expected error response', async () => {
    const mockTuftContext = {
      request: {
        headers: { host: MOCK_HOST },
        searchParams: new Map([['url', '']]),
      },
    } as unknown as TuftContext;

    const result = createShortUrl(
      //@ts-expect-error
      mockDb,
      mockTuftContext,
    );

    await expect(result).resolves.toEqual(badRequestResponse);
    expect(mockDb.findOne).not.toHaveBeenCalled();
    expect(mockDb.insertOne).not.toHaveBeenCalled();
  });
});

describe('When passed a context with a url that cannot be inserted', () => {
  test('returns an object containing the expected error response', async () => {
    const mockTuftContext = {
      request: {
        headers: { host: MOCK_HOST },
        searchParams: new Map([['url', MOCK_URL_INVALID]]),
      },
    } as unknown as TuftContext;

    const result = createShortUrl(
      //@ts-expect-error
      mockDb,
      mockTuftContext,
    );

    await expect(result).resolves.toEqual(serverErrorResponse);
    expect(mockDb.findOne).toHaveBeenCalled();
    expect(mockDb.insertOne).toHaveBeenCalled();
  });
});

describe('When the database query throws an error', () => {
  test('returns an object containing the expected error response', async () => {
    const mockTuftContext = {
      request: {
        headers: { host: MOCK_HOST },
        searchParams: new Map([['url', MOCK_URL_ERROR]]),
      },
    } as unknown as TuftContext;

    const result = createShortUrl(
      //@ts-expect-error
      mockDb,
      mockTuftContext,
    );

    await expect(result).resolves.toEqual(serverErrorResponse);
    expect(mockConsoleError).toHaveBeenCalledWith(Error('mock error'));
    expect(mockDb.findOne).toHaveBeenCalled();
    expect(mockDb.insertOne).toHaveBeenCalled();
  });
});