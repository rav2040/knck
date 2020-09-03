import type { TuftContext } from 'tuft';
import type { DbClient } from '../db';

import { randomBytes } from 'crypto';
import { promisify } from 'util';
import { URL } from 'url';
import { badRequestResponse, serverErrorResponse } from '../error-responses';

const randomBytesAsync = promisify(randomBytes);

export async function create(db: DbClient, t: TuftContext) {
  const { headers, protocol, body } = t.request;

  if (typeof body !== 'object' || body === null || Buffer.isBuffer(body)) {
    return badRequestResponse;
  }

  const originalUrl = body.url;

  try {
    new URL(originalUrl);
  } catch (err) {
    // The provided URL is not valid.
    return badRequestResponse;
  }

  try {
    let urlId: string;
    let success = false;

    do {
      urlId = (await randomBytesAsync(4))
        .toString('base64')                // Create a random string
        .slice(0, 6)                       // Trim it to 6 characters
        .replace(/[+/]/g, 'a');            // Ensure no '+' characters

      // Create a new item with a random ID and url.
      const knckUrlItem = {
        urlId,
        url: originalUrl,
      };

      // Add the item to the table.
      success = await db.put(knckUrlItem);
    } while (!success);

    // Form the short URL to be passed back in the response.
    const shortUrl = protocol + '://' + headers.host + '/' + urlId;

    return {
      render: 'result',
      data: { shortUrl },
    };
  }

  catch (err) {
    console.error(err);
    return serverErrorResponse;
  }
}
