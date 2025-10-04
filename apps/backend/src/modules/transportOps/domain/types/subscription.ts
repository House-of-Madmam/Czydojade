import type { Priority } from './priority.ts';

export interface BaseSubscription {
  readonly id: string;
  readonly userId: string;
  readonly minPriority: Priority;
  readonly isActive: boolean;
  readonly createdAt: Date;
}

export interface LineSubscription extends BaseSubscription {
  readonly lineId: string;
}

export interface AreaSubscription extends BaseSubscription {
  readonly latitude: number;
  readonly longitude: number;
  readonly radiusMeters: number;
}

export type Subscription = LineSubscription | AreaSubscription;

export type { Priority };
