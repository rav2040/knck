import type { TuftContext } from 'tuft';
import type { Collection } from 'mongodb';

import { randomBytes } from 'crypto';
import { promisify } from 'util';
import { URL } from 'url';
import { badRequestResponse, serverErrorResponse } from '../error-responses';

const randomBytesAsync = promisify(randomBytes);

// The created server is an HTTP server, but in production requests will come via
// a reverse proxy or load balancer utilizing HTTPS.
/* istanbul ignore next */
const baseUriPrefix = process.env.NODE_ENV === 'production'
  ? 'https://'
  : 'http://';

export async function createShortUrl(db: Collection, t: TuftContext) {
  const originalUrl = t.request.searchParams.get('url');

  try {
    new URL(originalUrl);
  } catch (err) {
    // The provided url is not a valid URL.
    return badRequestResponse;
  }

  try {
    let hash: string;

    // Create a hash of random bytes and then check that a document with that hash
    // does not already exist in the database. If it does, keep creating random hashes
    // until one that doesn't already exist is found.
    do {
      hash = (await randomBytesAsync(4))
        .toString('base64')                     // Create a random string
        .slice(0, 6)                            // Trim it to 6 characters
        .replace(/[+/]/g, 'a');                 // Ensure no '+' characters
    } while (await db.findOne({ hash }));

    // Create a new database document with the random hash and url.
    const shortUrlDocument = {
      hash,
      url: originalUrl,
      timestamp: new Date(),
    };

    const result = await db.insertOne(shortUrlDocument);

    if (result.insertedCount !== 1) {
      // The document was not inserted successfully.
      return serverErrorResponse;
    }

    // Form the short URL to be passed back in the response.
    const shortUrl = baseUriPrefix + t.request.headers.host + '/' + hash;

    return {
      json: {
        originalUrl,
        shortUrl,
      },
    };
  }

  catch (err) {
    console.error(err);
    return serverErrorResponse;
  }
}
