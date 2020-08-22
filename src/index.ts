import { tuft, createSearchParams } from 'tuft';
import { MongoClient } from 'mongodb';
import { randomBytes } from 'crypto';
import { promisify } from 'util';
import { join } from 'path';
import { URL } from 'url';

const randomBytesAsync = promisify(randomBytes);

if (process.env.PORT === undefined) {
  const err = new Error('\'PORT\' environment variable must be set.');
  console.error(err);
  process.exit(1);
}

const PORT = parseInt(process.env.PORT, 10);

if (!Number.isInteger(PORT)) {
  const err = new Error('\'PORT\' environment variable must be an integer.');
  console.error(err);
  process.exit(1);
}

const baseUriPrefix = process.env.NODE_ENV === 'production' ? 'https://' : 'http://';

if (process.env.DB_URI === undefined) {
  const err = new Error('\'DB_URI\' environment variable must be set.');
  console.error(err);
  process.exit(1);
}

const DB_URI = process.env.DB_URI;
const DB_NAME = process.env.DB_NAME;

const badRequestResponse = {
  status: 400,
  text: 'Bad Request',
};

const notFoundResponse = {
  status: 404,
  text: 'Not Found',
};

const serverErrorResponse = {
  status: 500,
  text: 'Internal Server Error',
};

async function main() {
  const dbClient = new MongoClient(DB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  await dbClient.connect();

  process.on('exit', () => {
    dbClient.close();
  });

  const app = tuft({
    preHandlers: [createSearchParams()],
  });

  app.onError(console.error);

  await app.static('/', join(__dirname, '../assets'));

  app.set('POST /new', async t => {
    const originalUrl = t.request.searchParams.get('url');

    try {
      new URL(originalUrl);
    } catch (err) {
      return badRequestResponse;
    }

    try {
      const collection = dbClient
        .db(DB_NAME)
        .collection('shortUrls');

      let hash: string;

      do {
        hash = (await randomBytesAsync(4))
          .toString('base64')
          .slice(0, 6)
          .replace(/[+/]/g, 'a');
      } while (await collection.findOne({ hash }));

      const shortUrlDocument = {
        hash,
        url: originalUrl,
        timestamp: new Date(),
      };

      const result = await collection.insertOne(shortUrlDocument);

      if (result.insertedCount !== 1) {
        return serverErrorResponse;
      }

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
  });

  app.set('GET /{hash}', async ({ request }) => {
    const { hash } = request.params;

    try {
      const collection = dbClient
        .db(DB_NAME)
        .collection('shortUrls');

      const result = await collection.findOne({ hash });

      if (!result) {
        return notFoundResponse;
      }

      return {
        redirect: result.url,
      };
    }

    catch (err) {
      console.error(err);
      return serverErrorResponse;
    }
  });

  app.set('/{**}', notFoundResponse);

  const server = app.createServer({ port: PORT });
  const { host, port } = await server.start();
  console.log(`Server is listening at http://${host}:${port}`);
}

main();
