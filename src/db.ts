import { DB_TABLE_NAME } from './constants';
import { config as AWSconfig, DynamoDB } from 'aws-sdk';

export interface DbInstance {
  getItem: (hash: string) => Promise<KnckUrlItem | undefined>;
  putItem: (params: KnckUrlItem) => Promise<boolean>;
}

interface KnckUrlItem {
  hash: string;
  url: string;
}

const DB_ITEM_TTL = 2_592_000; // seconds

if (process.env.NODE_ENV !== 'production') {
  if (process.env.DB_ENDPOINT === undefined) {
    const err = new Error('\'DB_ENDPOINT\' environment variable must be set.');
    console.error(err);
    process.exit(1);
  }

  AWSconfig.update({
    endpoint: process.env.DB_ENDPOINT,
  }, true);
}

else {
  /* istanbul ignore next */
  if (process.env.AWS_REGION === undefined) {
    const err = new Error('\'AWS_REGION\' environment variable must be set.');
    console.error(err);
    process.exit(1);
  }

  if (process.env.AWS_ACCESS_KEY_ID === undefined) {
    const err = new Error('\'AWS_ACCESS_KEY_ID\' environment variable must be set.');
    console.error(err);
    process.exit(1);
  }

  if (process.env.AWS_SECRET_ACCESS_KEY === undefined) {
    const err = new Error('\'AWS_SECRET_ACCESS_KEY\' environment variable must be set.');
    console.error(err);
    process.exit(1);
  }

  AWSconfig.update({
    region: process.env.AWS_REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  });
}


const tableParams = {
  TableName : DB_TABLE_NAME,
  KeySchema: [
    { AttributeName: 'UrlId', KeyType: 'HASH' },
  ],
  AttributeDefinitions: [
    { AttributeName: 'UrlId', AttributeType: 'S' },
  ],
  ProvisionedThroughput: {
    ReadCapacityUnits: 25,
    WriteCapacityUnits: 25,
  }
};

export async function createDbInstance(): Promise<DbInstance> {
  try {
    const db = new DynamoDB();

    // Check for existing table
    const { TableNames } = await db
      .listTables({})
      .promise();

    if (!TableNames?.includes(DB_TABLE_NAME)) {
      // Table does not exist

      await db
        .createTable(tableParams)
        .promise();

      const ttlParams = {
        TableName: DB_TABLE_NAME,
        TimeToLiveSpecification: {
          AttributeName: 'ExpirationTime',
          Enabled: true,
        }
      };

      await db
        .updateTimeToLive(ttlParams)
        .promise();
    }

    const getItem = async (hash: string) => {
      const params = {
        TableName: DB_TABLE_NAME,
        Key: {
          'UrlId': { S: hash },
        },
      };

      const { Item } = await db
        .getItem(params)
        .promise();

      if (Item) {
        return {
          hash: Item.UrlId.S as string,
          url: Item.Url.S as string,
        };
      }
    };

    const putItem = async ({ hash, url }: KnckUrlItem) => {
      const currentTime = ~~(Date.now() / 1000); // in seconds, as an integer
      const expirationTime = currentTime + DB_ITEM_TTL;

      const params = {
        TableName: DB_TABLE_NAME,
        ReturnConsumedCapacity: 'TOTAL',
        ConditionExpression: 'attribute_not_exists(UrlId)',
        Item: {
          'UrlId': { S: hash },
          'Url': { S: url },
          'ExpirationTime': { N: expirationTime.toString() },
        },
      };

      try {
        const { ConsumedCapacity } = await db
          .putItem(params)
          .promise();

        return ConsumedCapacity?.CapacityUnits === 1;
      }

      catch (err) {
        if (err.message === 'The conditional request failed') {
          return false;
        }

        throw err;
      }
    };

    return { getItem, putItem };
  }

  catch (err) {
    console.error(err);
    process.exit(1);
  }
}
