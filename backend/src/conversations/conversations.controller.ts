import {
  Body, Controller, Get, Param, Patch, Post, Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ConversationChannel, ConversationStatus } from '@prisma/client';
import { ConversationsService } from './conversations.service';
import {
  AssignAgentDto,
  CreateConversationDto,
  SendMessageDto,
} from './dto/create-conversation.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('conversations')
@ApiBearerAuth()
@Controller('conversations')
export class ConversationsController {
  constructor(private readonly conversationsService: ConversationsService) {}

  @Post()
  @ApiOperation({ summary: 'Crear conversación' })
  create(@Body() dto: CreateConversationDto) {
    return this.conversationsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar conversaciones' })
  @ApiQuery({ name: 'status', required: false, enum: ConversationStatus })
  @ApiQuery({ name: 'channel', required: false, enum: ConversationChannel })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findAll(
    @Query('status') status?: ConversationStatus,
    @Query('channel') channel?: ConversationChannel,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.conversationsService.findAll({
      status,
      channel,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener conversación por ID' })
  findOne(@Param('id') id: string) {
    return this.conversationsService.findOne(id);
  }

  @Get(':id/messages')
  @ApiOperation({ summary: 'Obtener mensajes de una conversación' })
  getMessages(@Param('id') id: string) {
    return this.conversationsService.getMessages(id);
  }

  @Post(':id/messages')
  @ApiOperation({ summary: 'Enviar mensaje como agente' })
  sendMessage(
    @Param('id') id: string,
    @Body() dto: SendMessageDto,
    @CurrentUser() user: any,
  ) {
    return this.conversationsService.sendAgentMessage(id, dto, user.id);
  }

  @Patch(':id/assign')
  @ApiOperation({ summary: 'Asignar agente a conversación' })
  assignAgent(@Param('id') id: string, @Body() dto: AssignAgentDto) {
    return this.conversationsService.assignAgent(id, dto);
  }

  @Patch(':id/handoff')
  @ApiOperation({ summary: 'Transferir conversación a agente humano' })
  handoff(@Param('id') id: string) {
    return this.conversationsService.handoffToHuman(id);
  }

  @Patch(':id/return-to-bot')
  @ApiOperation({ summary: 'Devolver conversación al bot' })
  returnToBot(@Param('id') id: string) {
    return this.conversationsService.returnToBot(id);
  }

  @Patch(':id/close')
  @ApiOperation({ summary: 'Cerrar conversación' })
  close(@Param('id') id: string) {
    return this.conversationsService.closeConversation(id);
  }
}
