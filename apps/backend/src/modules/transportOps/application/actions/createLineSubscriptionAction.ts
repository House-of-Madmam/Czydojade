import { ResourceNotFoundError } from '../../../../common/errors/resourceNotFoundError.ts';
import type { LineRepository } from '../../domain/repositories/lineRepository.ts';
import type { SubscriptionRepository } from '../../domain/repositories/subscriptionRepository.ts';
import type { LineSubscription, Priority } from '../../domain/types/subscription.ts';

export interface CreateLineSubscriptionActionPayload {
  readonly userId: string;
  readonly lineId: string;
  readonly minPriority: Priority;
  readonly isActive?: boolean;
}

export class CreateLineSubscriptionAction {
  public constructor(
    private readonly subscriptionRepository: SubscriptionRepository,
    private readonly lineRepository: LineRepository,
  ) {}

  public async execute(payload: CreateLineSubscriptionActionPayload): Promise<LineSubscription> {
    const line = await this.lineRepository.findById(payload.lineId);

    if (!line) {
      throw new ResourceNotFoundError({ resource: 'Line', lineId: payload.lineId });
    }

    return this.subscriptionRepository.createLineSubscription(payload);
  }
}
