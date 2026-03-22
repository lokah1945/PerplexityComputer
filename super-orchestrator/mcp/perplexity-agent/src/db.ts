import { MongoClient, Db, Collection } from 'mongodb';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://admin:password123@localhost:27017';
const DB_NAME = 'perplexity_brain';

let client: MongoClient | null = null;
let database: Db | null = null;

export const db = {
  async getCollection(name: string): Promise<Collection> {
    if (!database) {
      client = new MongoClient(MONGO_URI);
      await client.connect();
      database = client.db(DB_NAME);
    }
    return database.collection(name);
  },
  
  async close() {
    if (client) {
      await client.close();
      client = null;
      database = null;
    }
  }
};
