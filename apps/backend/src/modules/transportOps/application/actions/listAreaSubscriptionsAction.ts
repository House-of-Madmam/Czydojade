import type { SubscriptionRepository } from '../../domain/repositories/subscriptionRepository.ts';
import type { AreaSubscription } from '../../domain/types/subscription.ts';

export class ListAreaSubscriptionsAction {
  public constructor(private readonly subscriptionRepository: SubscriptionRepository) {}

  public async execute(userId: string): Promise<AreaSubscription[]> {
    return this.subscriptionRepository.listAreaSubscriptions(userId);
  }
}
