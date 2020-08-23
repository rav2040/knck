export class MongoClient {
  async connect(): Promise<MongoClient> {
    return this;
  }

  async close(): Promise<void> {
    return void 0;
  }

  db(dbName: string) {
    return {
      collection(name: string) {
        return {
          dbName,
          collectionName: name,
        };
      },
    };
  }
}
