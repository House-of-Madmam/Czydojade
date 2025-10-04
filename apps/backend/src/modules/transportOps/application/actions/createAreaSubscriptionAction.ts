import { OperationNotValidError } from '../../../../common/errors/operationNotValidError.ts';
import type { SubscriptionRepository } from '../../domain/repositories/subscriptionRepository.ts';
import type { AreaSubscription, Priority } from '../../domain/types/subscription.ts';

export interface CreateAreaSubscriptionActionPayload {
  readonly userId: string;
  readonly latitude: number;
  readonly longitude: number;
  readonly radiusMeters: number;
  readonly minPriority: Priority;
  readonly isActive?: boolean;
}

export class CreateAreaSubscriptionAction {
  public constructor(private readonly subscriptionRepository: SubscriptionRepository) {}

  public async execute(payload: CreateAreaSubscriptionActionPayload): Promise<AreaSubscription> {
    if (payload.radiusMeters <= 0) {
      throw new OperationNotValidError({ reason: 'radiusMeters must be positive.' });
    }

    return this.subscriptionRepository.createAreaSubscription(payload);
  }
}
