import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private logger = new Logger('EventsGateway');

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join_project')
  handleJoinProject(client: Socket, projectId: string) {
    client.join(`project_${projectId}`);
    return { status: 'joined', projectId };
  }

  emitPropertyStatusChanged(data: { propertyId: string; status: string; code: string; projectId: string }) {
    if (this.server) {
      this.server.emit('property_status_changed', data);
      this.server.to(`project_${data.projectId}`).emit('property_updated', data);
    }
  }

  emitPaymentReceived(data: { paymentId: string; receiptNumber: string; amount: number; contractId: string }) {
    if (this.server) {
      this.server.emit('payment_received', data);
    }
  }

  emitBookingCreated(data: { bookingId: string; reference: string; propertyId: string }) {
    if (this.server) {
      this.server.emit('booking_created', data);
    }
  }

  emitNotification(userId: string, notification: any) {
    if (this.server) {
      this.server.emit(`notification_${userId}`, notification);
    }
  }
}
