import { MongoClient } from 'mongodb';

const COLLECTION_NAME = 'shortUrls';

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

const dbUri = process.env.DB_URI;
const dbName = process.env.DB_NAME;

export async function createDbInstance() {
  const client = new MongoClient(dbUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  await client.connect();

  process.on('exit', () => {
    client.close();
  });

  const db = client
    .db(dbName)
    .collection(COLLECTION_NAME);

  return db;
}
