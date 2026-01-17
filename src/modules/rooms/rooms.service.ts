import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Room } from './entities/room.entity';
import { CreateRoomDto, UpdateCodeDto } from './dto/create-room.dto';
import { RedisService } from '../redis/redis.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class RoomsService {
  constructor(
    @InjectRepository(Room)
    private readonly roomRepository: Repository<Room>,
    private readonly redisService: RedisService,
  ) {}

  async create(createRoomDto: CreateRoomDto): Promise<Room> {
    try {
      const roomId = this.generateRoomId();
      const initialCode = createRoomDto.initialCode || '';

      const room = this.roomRepository.create({
        roomId,
        code: initialCode,
        language: createRoomDto.language || 'javascript',
        activeUsers: 0,
      });

      const savedRoom = await this.roomRepository.save(room);

      // Cache in Redis
      await this.redisService.setRoomCode(roomId, initialCode);
      await this.redisService.setRoomLanguage(
        roomId,
        createRoomDto.language || 'javascript',
      );

      return savedRoom;
    } catch (error) {
      throw new InternalServerErrorException('Failed to create room');
    }
  }

  async findOne(roomId: string): Promise<Room> {
    const room = await this.roomRepository.findOne({
      where: { roomId },
    });

    if (!room) {
      throw new NotFoundException(`Room with ID ${roomId} not found`);
    }

    return room;
  }

  async updateCode(roomId: string, updateCodeDto: UpdateCodeDto): Promise<void> {
    const room = await this.findOne(roomId);

    room.code = updateCodeDto.code;
    if (updateCodeDto.language) {
      room.language = updateCodeDto.language;
    }

    await this.roomRepository.save(room);

    // Update Redis cache
    await this.redisService.setRoomCode(roomId, updateCodeDto.code);
    if (updateCodeDto.language) {
      await this.redisService.setRoomLanguage(roomId, updateCodeDto.language);
    }
  }

  async incrementActiveUsers(roomId: string): Promise<void> {
    const room = await this.findOne(roomId);
    room.activeUsers += 1;
    await this.roomRepository.save(room);
  }

  async decrementActiveUsers(roomId: string): Promise<void> {
    const room = await this.findOne(roomId);
    room.activeUsers = Math.max(0, room.activeUsers - 1);
    await this.roomRepository.save(room);
  }

  async delete(roomId: string): Promise<void> {
    const room = await this.findOne(roomId);
    await this.roomRepository.remove(room);

    // Clear Redis cache
    await this.redisService.del(`room:${roomId}:code`);
    await this.redisService.del(`room:${roomId}:language`);
  }

  private generateRoomId(): string {
    return uuidv4().split('-')[0] + '-' + uuidv4().split('-')[1];
  }
}
