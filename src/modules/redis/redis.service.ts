import { Injectable, Inject, OnModuleDestroy } from '@nestjs/common';
import { RedisClientType } from 'redis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  constructor(
    @Inject('REDIS_CLIENT') private readonly redisClient: RedisClientType,
  ) {}

  async get(key: string): Promise<string | null> {
    return await this.redisClient.get(key);
  }

  async set(key: string, value: string, ttl?: number): Promise<void> {
    if (ttl) {
      await this.redisClient.setEx(key, ttl, value);
    } else {
      await this.redisClient.set(key, value);
    }
  }

  async del(key: string): Promise<void> {
    await this.redisClient.del(key);
  }

  async exists(key: string): Promise<boolean> {
    const result = await this.redisClient.exists(key);
    return result === 1;
  }

  async setRoomCode(roomId: string, code: string): Promise<void> {
    await this.set(`room:${roomId}:code`, code, 86400); // 24 hours TTL
  }

  async getRoomCode(roomId: string): Promise<string | null> {
    return await this.get(`room:${roomId}:code`);
  }

  async setRoomLanguage(roomId: string, language: string): Promise<void> {
    await this.set(`room:${roomId}:language`, language, 86400);
  }

  async getRoomLanguage(roomId: string): Promise<string | null> {
    return await this.get(`room:${roomId}:language`);
  }

  onModuleDestroy() {
    this.redisClient.quit();
  }
}
