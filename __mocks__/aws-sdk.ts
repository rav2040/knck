interface PutItemParams {
  TableName: string,
  ReturnConsumedCapacity: string,
  ConditionExpression: string,
  Item: { [key: string]: any },
}

interface GetItemParams {
  TableName: string,
  Key: { [key: string]: any },
}

export const config = {
  update: () => undefined,
};

const MOCK_TABLE_NAME = 'mockTable';
const MOCK_URL_ID = 'f6G32a';
const MOCK_URL = 'https://www.example.com/';

export class DynamoDB {
  listTables() {
    return {
      async promise() {
        return {
          TableNames: [MOCK_TABLE_NAME],
        };
      }
    };
  }

  createTable() {
    return { promise: async () => undefined };
  }

  updateTimeToLive() {
    return { promise: async () => undefined };
  }

  putItem({ TableName, ReturnConsumedCapacity, ConditionExpression, Item }: PutItemParams) {
    return {
      async promise() {
        if (Item?.UrlId?.S === 'trigger_mock_error') {
          return {};
        }

        if (Item?.UrlId?.S === 'trigger_empty_response') {
          throw Error('mock error');
        }

        if (TableName !== MOCK_TABLE_NAME) {
          throw Error('Table does not exist.');
        }

        if (ReturnConsumedCapacity !== 'TOTAL') {
          throw Error('Mock AWS SDK error: `ReturnConsumedCapacity` is invalid');
        }

        if (ConditionExpression !== 'attribute_not_exists(UrlId)') {
          throw Error('Mock AWS SDK error: `ConditionExpression` is invalid');
        }

        if (Item?.UrlId?.S === MOCK_URL_ID) {
          throw Error('The conditional request failed');
        }

        if (typeof Item?.UrlId?.S === 'string' && typeof Item?.Url?.S === 'string') {
          return {
            ConsumedCapacity: {
              CapacityUnits: 1,
            },
          };
        }

        return {
          ConsumedCapacity: {
            CapacityUnits: 0,
          },
        };
      }
    };
  }

  getItem({ TableName, Key }: GetItemParams) {
    return {
      async promise() {
        if (TableName !== MOCK_TABLE_NAME) {
          throw Error('Table does not exist.');
        }

        if (Key.UrlId?.S === MOCK_URL_ID) {
          return {
            Item: {
              UrlId: { S: MOCK_URL_ID },
              Url: { S: MOCK_URL },
            },
          };
        }

        return {};
      }
    };
  }
}
