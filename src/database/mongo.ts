import { MongoClient, type Db } from 'mongodb';

type MongoConnection = {
  client: MongoClient;
  db: Db;
};

let cachedConnection: MongoConnection | null = null;

const buildMongoClient = async (): Promise<MongoClient> => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is not configured');
  }

  if (cachedConnection?.client) {
    return cachedConnection.client;
  }

  const client = new MongoClient(uri);
  await client.connect();
  return client;
};

const createConnection = async (): Promise<MongoConnection> => {
  if (cachedConnection) {
    return cachedConnection;
  }

  const client = await buildMongoClient();
  const dbName = process.env.MONGODB_DB ?? 'cross-poster';
  const db = client.db(dbName);
  cachedConnection = { client, db };
  return cachedConnection;
};

export const connectMongo = async (): Promise<MongoConnection> => {
  return createConnection();
};

export const getDatabase = async (): Promise<Db> => {
  const connection = await createConnection();
  return connection.db;
};

export const disconnectMongo = async (): Promise<void> => {
  if (cachedConnection?.client) {
    await cachedConnection.client.close();
  }
  cachedConnection = null;
};
