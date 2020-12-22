import type { TuftContext } from 'tuft';

import { create } from '../../src/controllers/create';
import { badRequestResponse, serverErrorResponse } from '../../src/error-responses';

const MOCK_HOST = 'localhost:3000';
const MOCK_URL = 'https://www.example.com';
const MOCK_URL_INVALID = 'https://www.example.com/invalid';
const MOCK_URL_ERROR = 'https://www.example.com/error';

const mockDbClient = {
  put: jest.fn(async item => {
    if (item.url === MOCK_URL_ERROR) {
      throw Error('mock error');
    }

    return item.url !== MOCK_URL_INVALID;
  }),
};

const mockConsoleError = jest
  .spyOn(console, 'error')
  .mockImplementation(() => { });

afterAll(() => {
  mockConsoleError.mockRestore();
});

describe('When passed a context with an existing url', () => {
  test('returns an object containing the original URL and a valid short URL', async () => {
    const mockTuftContext = {
      request: {
        headers: { host: MOCK_HOST },
        body: { url: MOCK_URL },
      },
    } as unknown as TuftContext;

    const result = await create(
      //@ts-expect-error
      mockDbClient,
      mockTuftContext,
    );

    expect(result).toBeDefined();
    expect(result).toHaveProperty('render', 'result');
    expect(result).toHaveProperty('data');
    //@ts-expect-error
    expect(result.data).toHaveProperty('shortUrl');
    //@ts-expect-error
    expect(result.data.shortUrl.startsWith('http://' + MOCK_HOST));
    expect(mockDbClient.put).toHaveBeenCalled();
  });
});

describe('When passed a context requesting a JSON response', () => {
  test('returns an object containing the original URL and a valid short URL', async () => {
    const mockTuftContext = {
      request: {
        headers: { host: MOCK_HOST },
        body: {
          url: MOCK_URL,
          jsonResponse: true,
        },
      },
    } as unknown as TuftContext;

    const result = await create(
      //@ts-expect-error
      mockDbClient,
      mockTuftContext,
    );

    expect(result).toBeDefined();
    expect(result).toHaveProperty('json');
    //@ts-expect-error
    expect(result.json).toHaveProperty('shortUrl');
    //@ts-expect-error
    expect(result.json.shortUrl.startsWith('http://' + MOCK_HOST));
    expect(mockDbClient.put).toHaveBeenCalled();
  });
});

describe('When passed a context with an invalid body', () => {
  test('returns an object containing the expected error response', async () => {
    const mockTuftContext = {
      request: {
        headers: { host: MOCK_HOST },
        body: 42,
      },
    } as unknown as TuftContext;

    const result = create(
      //@ts-expect-error
      mockDbClient,
      mockTuftContext,
    );

    await expect(result).resolves.toEqual(badRequestResponse);
    expect(mockDbClient.put).not.toHaveBeenCalled();
  });
});

describe('When passed a context with an invalid url', () => {
  test('returns an object containing the expected error response', async () => {
    const mockTuftContext = {
      request: {
        headers: { host: MOCK_HOST },
        body: { url: '' },
      },
    } as unknown as TuftContext;

    const result = create(
      //@ts-expect-error
      mockDbClient,
      mockTuftContext,
    );

    await expect(result).resolves.toEqual(badRequestResponse);
    expect(mockDbClient.put).not.toHaveBeenCalled();
  });
});

describe('When the database query throws an error', () => {
  test('returns an object containing the expected error response', async () => {
    const mockTuftContext = {
      request: {
        headers: { host: MOCK_HOST },
        body: { url: MOCK_URL_ERROR },
      },
    } as unknown as TuftContext;

    const result = create(
      //@ts-expect-error
      mockDbClient,
      mockTuftContext,
    );

    await expect(result).resolves.toEqual(serverErrorResponse);
    expect(mockConsoleError).toHaveBeenCalledWith(Error('mock error'));
    expect(mockDbClient.put).toHaveBeenCalled();
  });
});
