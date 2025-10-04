import type { AreaSubscription, LineSubscription, Priority } from '../types/subscription.ts';

export interface CreateLineSubscriptionData {
  readonly userId: string;
  readonly lineId: string;
  readonly minPriority: Priority;
  readonly isActive?: boolean;
}

export interface CreateAreaSubscriptionData {
  readonly userId: string;
  readonly latitude: number;
  readonly longitude: number;
  readonly radiusMeters: number;
  readonly minPriority: Priority;
  readonly isActive?: boolean;
}

export interface SubscriptionRepository {
  createLineSubscription(data: CreateLineSubscriptionData): Promise<LineSubscription>;
  createAreaSubscription(data: CreateAreaSubscriptionData): Promise<AreaSubscription>;
  listLineSubscriptions(userId: string): Promise<LineSubscription[]>;
  listAreaSubscriptions(userId: string): Promise<AreaSubscription[]>;
  deleteSubscription(subscriptionId: string, userId: string): Promise<boolean>;
}
