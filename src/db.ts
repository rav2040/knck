import { DynamoDB } from 'aws-sdk';
import { DB_TABLE_NAME, DEFAULT_DB_ENDPOINT } from './constants';

export interface DbClient {
  get: (hash: string) => Promise<KnckUrlItem | undefined>;
  put: (params: KnckUrlItem) => Promise<boolean>;
}

interface KnckUrlItem {
  hash: string;
  url: string;
}

const DEFAULT_DB_TTL = 2_592_000;
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
    const dynamoDbConfig: DynamoDB.ClientConfiguration = {};

    if (process.env.NODE_ENV !== 'production') {
      // Set the DynamoDB endpoint to the local server.
      dynamoDbConfig.endpoint = process.env.DB_ENDPOINT ?? DEFAULT_DB_ENDPOINT;
    }

    const db = new DynamoDB(dynamoDbConfig);

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

    const get = async (hash: string) => {
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

    const put = async ({ hash, url }: KnckUrlItem) => {
      const currentTime = ~~(Date.now() / 1000); // As an integer (in seconds)
      const expirationTime = currentTime + ttl;

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
