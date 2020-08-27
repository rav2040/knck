import { tuft, createSearchParams } from 'tuft';
import { createHelmetPrehandler } from '@tuft/helmet-prehandler';
import { join } from 'path';
import { createDbInstance } from './db';
import { createShortUrl } from './controllers/create';
import { redirect } from './controllers/redirect';
import { notFoundResponse } from './error-responses';

if (process.env.NODE_ENV !== 'development' && process.env.NODE_ENV !== 'production') {
  const err = new Error('\'PORT\' environment variable must be set to \'development\' or \'production\'.');
  console.error(err);
  process.exit(1);
}

if (process.env.HOST === undefined) {
  const err = new Error('\'HOST\' environment variable must be set.');
  console.error(err);
  process.exit(1);
}

if (process.env.PORT === undefined) {
  const err = new Error('\'PORT\' environment variable must be set.');
  console.error(err);
  process.exit(1);
}

const assetsDir = process.env.NODE_ENV === 'production'
  ? '../assets/prod'
  : '../assets/dev';

async function init() {
  const db = await createDbInstance();

  const app = tuft({
    preHandlers: [
      createSearchParams(),
      createHelmetPrehandler({
        hidePoweredBy: false,
        ieNoOpen: false,
        frameguard: false,
      }),
    ],
  });

  // Serve static web assets from the root path.
  await app.static('/', join(__dirname, assetsDir));

  app
    .set('POST /new', createShortUrl.bind(null, db))
    .set('GET /{hash}', redirect.bind(null, db))
    .set('/{**}', notFoundResponse)
    .onError(console.error);

  const server = app.createServer({
    host: process.env.HOST,
    port: process.env.PORT,
  });
  const { host, port } = await server.start();
  console.log(`Server is listening at http://${host}:${port}`);
}

init();
