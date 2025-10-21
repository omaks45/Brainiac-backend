import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';

@Injectable()
export class WsJwtGuard implements CanActivate {
    constructor(private jwtService: JwtService) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        try {
        const client: Socket = context.switchToWs().getClient<Socket>();
        const token = this.extractToken(client);

        if (!token) {
            throw new WsException('Unauthorized');
        }

        const payload = await this.jwtService.verifyAsync(token, {
            secret: process.env.JWT_SECRET,
        });

        // Attach user to socket
        client.data.user = payload;
        
        // Join user to their personal room for targeted events
        client.join(payload.sub);

        return true;
        } catch (err) {
        throw new WsException('Unauthorized');
        }
    }

    private extractToken(client: Socket): string | null {
        const authHeader = client.handshake.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
        return authHeader.substring(7);
        }
        
        // Also check query params for token
        return client.handshake.auth?.token || null;
    }
}