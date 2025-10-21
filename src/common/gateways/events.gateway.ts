// src/common/gateways/events.gateway.ts
import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
    cors: {
        origin: process.env.CORS_ORIGIN || 'http://localhost:5000',
        credentials: true,
    },
    namespace: '/events',
})
export class EventsGateway
    implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
    {
    @WebSocketServer()
    server: Server;

    private logger: Logger = new Logger('EventsGateway');

    afterInit(server: Server) {
        this.logger.log('WebSocket Gateway initialized');
    }

    handleConnection(client: Socket) {
        this.logger.log(`Client connected: ${client.id}`);
    }

    handleDisconnect(client: Socket) {
        this.logger.log(`Client disconnected: ${client.id}`);
    }

    // Helper method to emit to specific user
    emitToUser(userId: string, event: string, data: any) {
        this.server.to(userId).emit(event, data);
    }

    // Helper method to emit to multiple users
    emitToUsers(userIds: string[], event: string, data: any) {
        userIds.forEach(userId => {
        this.server.to(userId).emit(event, data);
        });
    }

    // Helper method to broadcast to all
    broadcast(event: string, data: any) {
        this.server.emit(event, data);
    }
}