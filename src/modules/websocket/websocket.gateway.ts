import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { RoomsService } from '../rooms/rooms.service';
import { RedisService } from '../redis/redis.service';
import { CodeService } from '../code/code.service';

interface CodeChangePayload {
  roomId: string;
  code: string;
  cursorPosition?: {
    line: number;
    column: number;
  };
  userId?: string;
}

interface JoinRoomPayload {
  roomId: string;
  userId?: string;
}

interface RunCodePayload {
  roomId: string;
  code: string;
  language: string;
  stdin?: string;
}

@WebSocketGateway({
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3001',
    credentials: true,
  },
  namespace: '/',
})
export class WebSocketGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(WebSocketGateway.name);
  private readonly roomUsers = new Map<string, Set<string>>();

  constructor(
    private readonly roomsService: RoomsService,
    private readonly redisService: RedisService,
    private readonly codeService: CodeService,
  ) {}

  async handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  async handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);

    // Remove client from all rooms
    for (const [roomId, users] of this.roomUsers.entries()) {
      if (users.has(client.id)) {
        users.delete(client.id);
        await this.roomsService.decrementActiveUsers(roomId);

        // Notify other users
        client.to(roomId).emit('user-left', {
          userId: client.id,
          activeUsers: users.size,
        });

        // Clean up empty rooms
        if (users.size === 0) {
          this.roomUsers.delete(roomId);
        }
      }
    }
  }

  @SubscribeMessage('join-room')
  async handleJoinRoom(
    @MessageBody() payload: JoinRoomPayload,
    @ConnectedSocket() client: Socket,
  ) {
    const { roomId } = payload;

    try {
      // Verify room exists
      await this.roomsService.findOne(roomId);

      // Join socket room
      await client.join(roomId);

      // Track user in room
      if (!this.roomUsers.has(roomId)) {
        this.roomUsers.set(roomId, new Set());
      }
      this.roomUsers.get(roomId).add(client.id);

      // Increment active users
      await this.roomsService.incrementActiveUsers(roomId);

      // Get current code from Redis or database
      let code = await this.redisService.getRoomCode(roomId);
      let language = await this.redisService.getRoomLanguage(roomId);

      if (!code) {
        const room = await this.roomsService.findOne(roomId);
        code = room.code || '';
        language = room.language || 'javascript';
      }

      // Send current code to the newly joined user
      client.emit('sync-code', {
        code,
        language,
        roomId,
      });

      // Notify other users in the room
      client.to(roomId).emit('user-joined', {
        userId: client.id,
        activeUsers: this.roomUsers.get(roomId).size,
      });

      this.logger.log(`Client ${client.id} joined room ${roomId}`);

      return {
        success: true,
        message: `Joined room ${roomId}`,
      };
    } catch (error) {
      this.logger.error(`Failed to join room ${roomId}: ${error.message}`);
      client.emit('error', {
        message: `Failed to join room: ${error.message}`,
      });
      return {
        success: false,
        message: error.message,
      };
    }
  }

  @SubscribeMessage('code-change')
  async handleCodeChange(
    @MessageBody() payload: CodeChangePayload,
    @ConnectedSocket() client: Socket,
  ) {
    const { roomId, code, cursorPosition } = payload;

    try {
      // Verify room exists
      await this.roomsService.findOne(roomId);

      // Update Redis cache immediately for fast retrieval
      await this.redisService.setRoomCode(roomId, code);

      // Broadcast to all users in the room except sender
      client.to(roomId).emit('code-updated', {
        code,
        cursorPosition,
        userId: client.id,
        timestamp: new Date().toISOString(),
      });

      // Periodically save to database (debounced - in production, use a queue)
      // For now, we'll save every time but in production you'd debounce this

      return {
        success: true,
      };
    } catch (error) {
      this.logger.error(`Code change error: ${error.message}`);
      client.emit('error', {
        message: `Failed to update code: ${error.message}`,
      });
      return {
        success: false,
        message: error.message,
      };
    }
  }

  @SubscribeMessage('language-change')
  async handleLanguageChange(
    @MessageBody() payload: { roomId: string; language: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { roomId, language } = payload;

    try {
      await this.roomsService.updateCode(roomId, { code: '', language });
      await this.redisService.setRoomLanguage(roomId, language);

      // Broadcast language change to all users in room
      this.server.to(roomId).emit('language-updated', {
        language,
        userId: client.id,
      });

      return {
        success: true,
      };
    } catch (error) {
      this.logger.error(`Language change error: ${error.message}`);
      client.emit('error', {
        message: `Failed to change language: ${error.message}`,
      });
      return {
        success: false,
        message: error.message,
      };
    }
  }

  @SubscribeMessage('run-code')
  async handleRunCode(
    @MessageBody() payload: RunCodePayload,
    @ConnectedSocket() client: Socket,
  ) {
    const { roomId, code, language, stdin } = payload;

    try {
      // Verify room exists
      await this.roomsService.findOne(roomId);

      // Notify room that code is running
      this.server.to(roomId).emit('code-running', {
        userId: client.id,
      });

      // Execute code
      const result = await this.codeService.executeCode(code, language, stdin);

      // Broadcast result to all users in room
      this.server.to(roomId).emit('code-result', {
        ...result,
        userId: client.id,
        timestamp: new Date().toISOString(),
      });

      return {
        success: true,
        ...result,
      };
    } catch (error) {
      this.logger.error(`Code execution error: ${error.message}`);
      client.emit('error', {
        message: `Code execution failed: ${error.message}`,
      });
      return {
        success: false,
        message: error.message,
      };
    }
  }

  @SubscribeMessage('leave-room')
  async handleLeaveRoom(
    @MessageBody() payload: { roomId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { roomId } = payload;

    // Remove from room tracking
    if (this.roomUsers.has(roomId)) {
      this.roomUsers.get(roomId).delete(client.id);
      await this.roomsService.decrementActiveUsers(roomId);

      // Notify other users
      client.to(roomId).emit('user-left', {
        userId: client.id,
        activeUsers: this.roomUsers.get(roomId).size,
      });

      if (this.roomUsers.get(roomId).size === 0) {
        this.roomUsers.delete(roomId);
      }
    }

    await client.leave(roomId);
    this.logger.log(`Client ${client.id} left room ${roomId}`);

    return {
      success: true,
    };
  }

  @SubscribeMessage('save-code')
  async handleSaveCode(
    @MessageBody() payload: { roomId: string; code: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { roomId, code } = payload;

    try {
      // Save to database
      await this.roomsService.updateCode(roomId, { code });

      // Confirm save to all users
      this.server.to(roomId).emit('code-saved', {
        userId: client.id,
        timestamp: new Date().toISOString(),
      });

      return {
        success: true,
        message: 'Code saved successfully',
      };
    } catch (error) {
      this.logger.error(`Save code error: ${error.message}`);
      client.emit('error', {
        message: `Failed to save code: ${error.message}`,
      });
      return {
        success: false,
        message: error.message,
      };
    }
  }
}
