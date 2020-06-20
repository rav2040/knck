import { tuft, createSearchParams } from 'tuft';
import { randomBytes } from 'crypto';
import { promisify } from 'util';
import { join } from 'path';
import { URL } from 'url';
import { readFileSync } from 'fs';
import { constants } from 'http2';

const {
  HTTP2_HEADER_SCHEME,
  HTTP2_HEADER_AUTHORITY,
} = constants;

const randomBytesAsync = promisify(randomBytes);

if (!process.env.PORT) {
  const err = new Error('\'PORT\' environment variable must be set.');
  console.error(err);
  process.exit(1);
}

const port = parseInt(process.env.PORT, 10);

let key, cert;

try {
  key = readFileSync('key.pem');
  cert = readFileSync('cert.pem');
}

catch (err) {
  console.error(err);
  process.exit(1);
}

const urls = new Map();

void async function() {
  const app = tuft({
    preHandlers: [createSearchParams()],
  });

  await app.static('/', join(__dirname, 'assets'));

  app.set('POST /new', async ({ request }) => {
    const originalUrl = request.searchParams.get('url');

    if (!originalUrl) {
      return { error: 'BAD_REQUEST' };
    }

    try {
      new URL(originalUrl);
    } catch (err) {
      return { error: 'BAD_REQUEST' };
    }

    let hash: string;

    do {
      hash = (await randomBytesAsync(4))
        .toString('base64')
        .slice(0, 6)
        .replace(/[+/]/g, 'a');
    } while (urls.has(hash));

    urls.set(hash, originalUrl);

    const scheme = request.headers[HTTP2_HEADER_SCHEME];
    const authority = request.headers[HTTP2_HEADER_AUTHORITY];
    const shortUrl = scheme + '://' + authority + '/' + hash;

    return {
      json: { originalUrl, shortUrl },
    };
  });

  app.set('GET /{hash}', ({ request }) => {
    const { hash } = request.params;
    const redirect = urls.get(hash);
    return !redirect ? { error: 'NOT_FOUND' } : { redirect };
  });

  app.onError(console.error);

  const server = app.createSecureServer({ port, key, cert });
  await server.start();
  console.log(`Server is listening at https://${server.host}:${server.port}`);
}();
