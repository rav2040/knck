import AWS, { DynamoDB } from 'aws-sdk';
import {
  DB_TABLE_NAME,
  DEFAULT_AWS_REGION,
  DEFAULT_DB_ENDPOINT,
  DEFAULT_DB_TTL,
} from './constants';

export interface DbClient {
  get: (urlId: string) => Promise<KnckUrlItem | undefined>;
  put: (params: KnckUrlItem) => Promise<boolean>;
}

interface KnckUrlItem {
  urlId: string;
  url: string;
}

const dbConfig: DynamoDB.ClientConfiguration = {};

if (process.env.NODE_ENV === 'production') {
  AWS.config = new AWS.Config({
    region: process.env.AWS_REGION ?? DEFAULT_AWS_REGION,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  });
}

else {
  AWS.config = new AWS.Config({
    region: process.env.AWS_REGION ?? DEFAULT_AWS_REGION,
  });

  // Set the DynamoDB endpoint to the local server.
  dbConfig.endpoint = process.env.DB_ENDPOINT ?? DEFAULT_DB_ENDPOINT;
}

const DB_ITEM_EXISTS_ERROR_MSG = 'The conditional request failed';

// How long database entries should exist before they expire (in seconds).
const ttl = ~~(process.env.DB_ITEM_TTL ?? DEFAULT_DB_TTL);

// Parameters for creating the DynamoDB table.
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

// Parameters for enabling TTL in the DynamoDB table.
const ttlParams = {
  TableName: DB_TABLE_NAME,
  TimeToLiveSpecification: {
    AttributeName: 'ExpirationTime',
    Enabled: true,
  }
};

export async function createDbClient(): Promise<DbClient> {
  try {
    const db = new DynamoDB(dbConfig);

    // Check for existing table
    const { TableNames } = await db
      .listTables({})
      .promise();

    const tableNotExists = !TableNames?.includes(DB_TABLE_NAME);

    if (tableNotExists) {
      // Create table
      await db
        .createTable(tableParams)
        .promise();

      // Enable TTL on the table
      await db
        .updateTimeToLive(ttlParams)
        .promise();
    }

    /**
     * Returns an item from the table if one is found with the provided URL ID.
     */

    const get = async (urlId: string) => {
      const params = {
        TableName: DB_TABLE_NAME,
        Key: {
          'UrlId': { S: urlId },
        },
      };

      const { Item } = await db
        .getItem(params)
        .promise();

      if (Item) {
        return {
          urlId: Item.UrlId.S as string,
          url: Item.Url.S as string,
        };
      }
    };

    /**
     * Adds an item to the table, returning true once the item is successfully added. Returns false
     * if an item with the provided URL ID already exists in the table.
     */

    const put = async ({ urlId, url }: KnckUrlItem) => {
      const currentTime = ~~(Date.now() / 1000); // As an integer (in seconds)
      const expirationTime = currentTime + ttl;

      const params = {
        TableName: DB_TABLE_NAME,
        ReturnConsumedCapacity: 'TOTAL',
        ConditionExpression: 'attribute_not_exists(UrlId)',
        Item: {
          'UrlId': { S: urlId },
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
        if (err.message === DB_ITEM_EXISTS_ERROR_MSG) {
          return false;
        }

        throw err;
      }
    };

    return { get, put };
  }

  catch (err) {
    console.error(err);
    process.exit(1);
  }
}
