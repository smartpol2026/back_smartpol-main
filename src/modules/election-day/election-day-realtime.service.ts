import { Injectable } from '@nestjs/common';
import type { Server } from 'socket.io';

export const ELECTION_DAY_EVENTS = {
  REPORT_CREATED: 'election-day.report.created',
  TABLE_UPDATED: 'election-day.table.updated',
  NOVELTY_CREATED: 'election-day.novelty.created',
} as const;

export type ElectionDayEventName =
  (typeof ELECTION_DAY_EVENTS)[keyof typeof ELECTION_DAY_EVENTS];

export type ElectionDayEvent<T> = {
  campaignId: number;
  event: ElectionDayEventName;
  data: T;
};

@Injectable()
export class ElectionDayRealtimeService {
  private server?: Server;

  attachServer(server: Server): void {
    this.server = server;
  }

  roomName(campaignId: number): string {
    return `campaign:${campaignId}`;
  }

  emitToCampaign<T>(
    campaignId: number,
    event: ElectionDayEventName,
    data: T,
  ): void {
    const payload: ElectionDayEvent<T> = {
      campaignId,
      event,
      data,
    };

    this.server?.to(this.roomName(campaignId)).emit(event, payload);
  }
}
