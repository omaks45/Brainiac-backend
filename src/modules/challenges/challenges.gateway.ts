
import {
    WebSocketGateway,
    SubscribeMessage,
    MessageBody,
    ConnectedSocket,
    WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards } from '@nestjs/common';
import { WsJwtGuard } from '../../common/guards/ws-jwt.guards';
import { ChallengesService } from './challenges.service';

@WebSocketGateway({
    cors: {
        origin: process.env.CORS_ORIGIN || 'http://localhost:3001',
        credentials: true,
    },
    namespace: '/challenges',
})
@UseGuards(WsJwtGuard)
export class ChallengesGateway {
    @WebSocketServer()
    server: Server;

    private logger: Logger = new Logger('ChallengesGateway');

    constructor(private challengesService: ChallengesService) {}

    @SubscribeMessage('challenge:join')
    async handleJoinChallenge(
        @MessageBody() data: { challengeId: string },
        @ConnectedSocket() client: Socket,
    ) {
        const userId = client.data.user.sub;
        
        try {
        const challenge = await this.challengesService.getChallengeById(
            data.challengeId,
            userId,
        );

        // Join room for this specific challenge
        client.join(`challenge:${data.challengeId}`);

        this.logger.log(`User ${userId} joined challenge room: ${data.challengeId}`);

        return {
            status: 'success',
            challenge,
        };
        } catch (error) {
        return {
            status: 'error',
            message: error.message,
        };
        }
    }

    @SubscribeMessage('challenge:leave')
    handleLeaveChallenge(
        @MessageBody() data: { challengeId: string },
        @ConnectedSocket() client: Socket,
    ) {
        client.leave(`challenge:${data.challengeId}`);
        this.logger.log(`User left challenge room: ${data.challengeId}`);
    }

    // Emit challenge update to all participants
    emitChallengeUpdate(challengeId: string, event: string, data: any) {
        this.server.to(`challenge:${challengeId}`).emit(event, data);
    }
}