import { Module } from '@nestjs/common';
import { WebSocketGateway } from './websocket.gateway';
import { RoomsModule } from '../rooms/rooms.module';
import { RedisModule } from '../redis/redis.module';
import { CodeModule } from '../code/code.module';

@Module({
  imports: [RoomsModule, RedisModule, CodeModule],
  providers: [WebSocketGateway],
  exports: [WebSocketGateway],
})
export class WebSocketModule {}
