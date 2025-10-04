import { ResourceNotFoundError } from '../../../../common/errors/resourceNotFoundError.ts';
import type { SubscriptionRepository } from '../../domain/repositories/subscriptionRepository.ts';

export class DeleteSubscriptionAction {
  public constructor(private readonly subscriptionRepository: SubscriptionRepository) {}

  public async execute(subscriptionId: string, userId: string): Promise<void> {
    const deleted = await this.subscriptionRepository.deleteSubscription(subscriptionId, userId);

    if (!deleted) {
      throw new ResourceNotFoundError({ resource: 'Subscription', subscriptionId, userId });
    }
  }
}
