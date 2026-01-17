import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoomsModule } from './modules/rooms/rooms.module';
import { CodeModule } from './modules/code/code.module';
import { WebSocketModule } from './modules/websocket/websocket.module';
import { RedisModule } from './modules/redis/redis.module';
import { Room } from './modules/rooms/entities/room.entity';
import databaseConfig from './config/database.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const dbType = configService.get<string>('database.type') || 'postgres';
        return {
          type: dbType as any,
          host: configService.get<string>('database.host'),
          port: configService.get<number>('database.port'),
          username: configService.get<string>('database.username'),
          password: configService.get<string>('database.password'),
          database: configService.get<string>('database.database'),
          entities: [Room],
          synchronize: configService.get<string>('NODE_ENV') === 'development',
          logging: configService.get<string>('NODE_ENV') === 'development',
        };
      },
      inject: [ConfigService],
    }),
    RedisModule,
    RoomsModule,
    CodeModule,
    WebSocketModule,
  ],
})
export class AppModule {}
