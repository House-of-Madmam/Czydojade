import type { SubscriptionRepository } from '../../domain/repositories/subscriptionRepository.ts';
import type { LineSubscription } from '../../domain/types/subscription.ts';

export class ListLineSubscriptionsAction {
  public constructor(private readonly subscriptionRepository: SubscriptionRepository) {}

  public async execute(userId: string): Promise<LineSubscription[]> {
    return this.subscriptionRepository.listLineSubscriptions(userId);
  }
}
