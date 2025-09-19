import type { Collection } from 'mongodb';
import { getDatabase } from '../../database/mongo';

export interface StoredConfigPayload {
  encryptedData: string;
  iv: string;
  salt: string;
  version?: string;
  updatedAt?: string;
}

interface StoredConfigDocument extends StoredConfigPayload {
  userId: string;
}

export class ConfigService {
  private collectionPromise?: Promise<Collection<StoredConfigDocument>>;

  constructor(private readonly collectionName = 'user_configs') {}

  private async getCollection(): Promise<Collection<StoredConfigDocument>> {
    if (!this.collectionPromise) {
      this.collectionPromise = this.initializeCollection();
    }
    return this.collectionPromise;
  }

  private async initializeCollection(): Promise<Collection<StoredConfigDocument>> {
    const db = await getDatabase();
    const collection = db.collection<StoredConfigDocument>(this.collectionName);
    await collection.createIndex({ userId: 1 }, { unique: true });
    return collection;
  }

  async saveConfig(userId: string, payload: StoredConfigPayload): Promise<void> {
    const collection = await this.getCollection();
    const storedPayload: StoredConfigDocument = {
      ...payload,
      userId,
      version: payload.version ?? '1.0',
      updatedAt: new Date().toISOString(),
    };

    await collection.updateOne(
      { userId },
      { $set: storedPayload },
      { upsert: true }
    );
  }

  async getConfig(userId: string): Promise<StoredConfigPayload | null> {
    const collection = await this.getCollection();
    const document = await collection.findOne({ userId });

    if (!document) {
      return null;
    }

    const { userId: _userId, ...payload } = document;
    return payload;
  }

  async deleteConfig(userId: string): Promise<void> {
    const collection = await this.getCollection();
    await collection.deleteOne({ userId });
  }

  async hasConfig(userId: string): Promise<boolean> {
    const collection = await this.getCollection();
    const count = await collection.countDocuments({ userId }, { limit: 1 });
    return count > 0;
  }
}

export const configService = new ConfigService();
