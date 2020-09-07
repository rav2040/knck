import { config as AWSconfig, DynamoDB } from 'aws-sdk';

export interface DbClient {
  get: (urlId: string) => Promise<KnckUrlItem | undefined>;
  put: (params: KnckUrlItem) => Promise<boolean>;
}

interface KnckUrlItem {
  urlId: string;
  url: string;
}

const DB_ITEM_EXISTS_ERROR_MSG = 'The conditional request failed';

const dbConfig: DynamoDB.ClientConfiguration = {};

/* istanbul ignore next*/
if (!process.env.AWS_REGION) {
  const err = Error('\'AWS_REGION\' environment variable must be set.');
  console.error(err);
  process.exit(1);
}

/* istanbul ignore next*/
if (process.env.NODE_ENV === 'production') {
  if (!process.env.AWS_ACCESS_KEY_ID) {
    const err = Error('\'AWS_ACCESS_KEY_ID\' environment variable must be set in production mode.');
    console.error(err);
    process.exit(1);
  }

  if (!process.env.AWS_SECRET_ACCESS_KEY) {
    const err = Error('\'AWS_SECRET_ACCESS_KEY\' environment variable must be set in production mode.');
    console.error(err);
    process.exit(1);
  }

  AWSconfig.update({
    region: process.env.AWS_REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    }
  });
}

else {
  if (!process.env.DB_ENDPOINT) {
    const err = Error('\'DB_ENDPOINT\' environment variable must be set in development mode.');
    console.error(err);
    process.exit(1);
  }

  // Set the DynamoDB endpoint to the local server.
  dbConfig.endpoint = process.env.DB_ENDPOINT;

  AWSconfig.update({ region: process.env.AWS_REGION });
}

export async function createClient(tableName: string, ttl: number): Promise<DbClient> {
  const db = new DynamoDB(dbConfig);

  // Check for existing table
  const { TableNames } = await db
    .listTables({})
    .promise();

  const tableNotExists = !(<string[]>TableNames).includes(tableName);

  if (tableNotExists) {
    // Parameters for creating the DynamoDB table.
    const tableParams = {
      TableName : tableName,
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

    // Create table
    await db
      .createTable(tableParams)
      .promise();

    // Parameters for enabling TTL in the DynamoDB table.
    const ttlParams = {
      TableName: tableName,
      TimeToLiveSpecification: {
        AttributeName: 'ExpirationTime',
        Enabled: true,
      }
    };

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
      TableName: tableName,
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
      TableName: tableName,
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
