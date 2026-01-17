import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { RoomsService } from './rooms.service';
import { CreateRoomDto } from './dto/create-room.dto';

@Controller('rooms')
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createRoomDto: CreateRoomDto) {
    const room = await this.roomsService.create(createRoomDto);
    return {
      success: true,
      data: {
        roomId: room.roomId,
        language: room.language,
        createdAt: room.createdAt,
      },
    };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const room = await this.roomsService.findOne(id);
    return {
      success: true,
      data: {
        roomId: room.roomId,
        code: room.code,
        language: room.language,
        activeUsers: room.activeUsers,
        createdAt: room.createdAt,
      },
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    await this.roomsService.delete(id);
  }
}
