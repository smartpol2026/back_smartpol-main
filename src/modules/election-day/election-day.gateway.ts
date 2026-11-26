import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsException,
} from '@nestjs/websockets';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { Server, Socket } from 'socket.io';
import { CampaignUser } from '../../database/entities/campaign-user.entity';
import { User } from '../../database/entities/user.entity';
import { PermissionsService } from '../../permissions/permissions.service';
import { ElectionDayRealtimeService } from './election-day-realtime.service';

type SocketUser = {
  id: number;
  email: string;
  roleId: number;
  organizationId?: number | null;
};

type AuthenticatedSocket = Socket & {
  data: {
    user?: SocketUser;
  };
};

type CampaignSubscription = {
  campaignId: number;
};

const websocketOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',')
      .map((origin) => origin.trim())
      .filter(Boolean)
  : [
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      'http://localhost:3000',
      'http://127.0.0.1:3000',
    ];

@WebSocketGateway({
  namespace: '/election-day',
  cors: {
    origin: websocketOrigins,
    methods: ['GET', 'POST'],
    allowedHeaders: ['Authorization', 'Content-Type'],
    credentials: false,
  },
  transports: ['websocket', 'polling'],
})
export class ElectionDayGateway implements OnGatewayInit, OnGatewayConnection {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly jwtService: JwtService,
    private readonly permissionsService: PermissionsService,
    private readonly realtime: ElectionDayRealtimeService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(CampaignUser)
    private readonly campaignUserRepository: Repository<CampaignUser>,
  ) {}

  afterInit(server: Server): void {
    this.realtime.attachServer(server);
  }

  async handleConnection(client: AuthenticatedSocket): Promise<void> {
    try {
      const user = await this.authenticate(client);
      client.data.user = user;

      // Permite reingresar automáticamente a la sala después de reconectar.
      const requestedCampaignId =
        client.handshake.auth?.campaignId ?? client.handshake.query?.campaignId;

      if (requestedCampaignId != null && requestedCampaignId !== '') {
        await this.subscribeToCampaign(client, Number(requestedCampaignId));
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No autenticado';
      client.emit('election-day.error', { message });
      client.disconnect(true);
    }
  }

  @SubscribeMessage('election-day.subscribe')
  async handleSubscribe(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() body: CampaignSubscription,
  ) {
    const campaignId = Number(body?.campaignId);
    await this.subscribeToCampaign(client, campaignId);

    return {
      ok: true,
      campaignId,
      room: this.realtime.roomName(campaignId),
    };
  }

  @SubscribeMessage('election-day.unsubscribe')
  async handleUnsubscribe(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() body: CampaignSubscription,
  ) {
    const campaignId = Number(body?.campaignId);
    if (!Number.isInteger(campaignId) || campaignId <= 0) {
      throw new WsException('campaignId inválido');
    }

    await client.leave(this.realtime.roomName(campaignId));
    return { ok: true, campaignId };
  }

  private async authenticate(client: AuthenticatedSocket): Promise<SocketUser> {
    const token = this.extractToken(client);
    if (!token) {
      throw new WsException('Token JWT requerido');
    }

    let payload: {
      sub?: number;
      email?: string;
      roleId?: number;
      organizationId?: number | null;
    };

    try {
      payload = await this.jwtService.verifyAsync(token);
    } catch {
      throw new WsException('Token JWT inválido o expirado');
    }

    if (!payload.sub) {
      throw new WsException('Token JWT inválido');
    }

    const user = await this.userRepository.findOne({
      where: { id: Number(payload.sub) },
      select: ['id', 'email', 'roleId', 'organizationId'],
    });

    if (!user?.roleId) {
      throw new WsException('Usuario no encontrado o sin rol');
    }

    return {
      id: user.id,
      email: user.email,
      roleId: user.roleId,
      organizationId: user.organizationId,
    };
  }

  private extractToken(client: Socket): string | null {
    const authToken = client.handshake.auth?.token;
    if (typeof authToken === 'string' && authToken.trim()) {
      return authToken.replace(/^Bearer\s+/i, '').trim();
    }

    const authorization = client.handshake.headers.authorization;
    if (typeof authorization === 'string') {
      const [scheme, token] = authorization.split(' ');
      if (/^Bearer$/i.test(scheme) && token) {
        return token;
      }
    }

    return null;
  }

  private async subscribeToCampaign(
    client: AuthenticatedSocket,
    campaignId: number,
  ): Promise<void> {
    const user = client.data.user;
    if (!user) {
      throw new WsException('No autenticado');
    }
    if (!Number.isInteger(campaignId) || campaignId <= 0) {
      throw new WsException('campaignId inválido');
    }

    const canReadBoard = await this.permissionsService.hasPermission(
      user.id,
      'control-board:read',
      user.roleId,
    );
    if (!canReadBoard) {
      throw new WsException(
        'No tiene permisos para consultar el tablero de control',
      );
    }

    const membership = await this.campaignUserRepository.findOne({
      where: { userId: user.id, campaignId },
      select: ['id'],
    });
    if (!membership) {
      throw new WsException('No tiene acceso a la información de esta campaña');
    }

    await client.join(this.realtime.roomName(campaignId));
  }
}
