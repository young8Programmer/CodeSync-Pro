import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RedisService } from './redis.service';
import { createClient } from 'redis';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: 'REDIS_CLIENT',
      useFactory: async (configService: ConfigService) => {
        const client = createClient({
          socket: {
            host: configService.get('redis.host'),
            port: configService.get('redis.port'),
          },
        });

        client.on('error', (err) => console.error('Redis Client Error', err));
        await client.connect();
        console.log('✅ Redis connected');
        return client;
      },
      inject: [ConfigService],
    },
    RedisService,
  ],
  exports: [RedisService],
})
export class RedisModule {}
