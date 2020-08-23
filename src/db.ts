import { MongoClient } from 'mongodb';

/* istanbul ignore next */
if (process.env.DB_URI === undefined) {
  const err = new Error('\'DB_URI\' environment variable must be set.');
  console.error(err);
  process.exit(1);
}

/* istanbul ignore next */
if (process.env.DB_NAME === undefined) {
  const err = new Error('\'DB_NAME\' environment variable must be set.');
  console.error(err);
  process.exit(1);
}

const DB_URI = process.env.DB_URI;
const DB_NAME = process.env.DB_NAME;
const COLLECTION_NAME = 'shortUrls';

export async function createDbInstance() {
  const client = new MongoClient(DB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  await client.connect();

  process.on('exit', () => {
    client.close();
  });

  const db = client
    .db(DB_NAME)
    .collection(COLLECTION_NAME);

  return db;
}
