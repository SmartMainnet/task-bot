import { IStorage } from '@tonconnect/sdk'

import { connectToMongoDB } from '../database/connect/index.js'
import { MapModel } from '../database/models/index.js'

await connectToMongoDB()

export class TonConnectStorage implements IStorage {
  constructor(private readonly chatId: number) {}

  private async getKey(key: string): Promise<string> {
    return `${this.chatId.toString()}${key}`
  }

  async removeItem(key: string): Promise<void> {
    const fullKey = await this.getKey(key)
    await MapModel.deleteOne({ chatId: this.chatId, key: fullKey })
  }

  async setItem(key: string, value: string): Promise<void> {
    const fullKey = await this.getKey(key)
    await MapModel.updateOne(
      { chatId: this.chatId, key: fullKey },
      { $set: { value } },
      { upsert: true }
    )
  }

  async getItem(key: string): Promise<string | null> {
    const fullKey = await this.getKey(key)
    const item = await MapModel.findOne({ chatId: this.chatId, key: fullKey })
    return item?.value ? item.value : null
  }
}
