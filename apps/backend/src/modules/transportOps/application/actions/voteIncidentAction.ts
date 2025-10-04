import { OperationNotValidError } from '../../../../common/errors/operationNotValidError.ts';
import { ResourceNotFoundError } from '../../../../common/errors/resourceNotFoundError.ts';
import type { IncidentRepository } from '../../domain/repositories/incidentRepository.ts';
import type { VoteRepository } from '../../domain/repositories/voteRepository.ts';
import type { Vote } from '../../domain/types/vote.ts';
import type { VoteType } from '../../domain/types/vote.ts';

export interface VoteIncidentActionPayload {
  readonly incidentId: string;
  readonly userId: string;
  readonly voteType: VoteType;
}

export class VoteIncidentAction {
  public constructor(
    private readonly incidentRepository: IncidentRepository,
    private readonly voteRepository: VoteRepository,
  ) {}

  public async execute(payload: VoteIncidentActionPayload): Promise<Vote> {
    const incident = await this.incidentRepository.findById(payload.incidentId);

    if (!incident) {
      throw new ResourceNotFoundError({ resource: 'Incident', incidentId: payload.incidentId });
    }

    const existingVote = await this.voteRepository.findByUserAndIncident(payload.userId, payload.incidentId);

    if (existingVote) {
      throw new OperationNotValidError({
        reason: 'User has already voted on this incident.',
      });
    }

    return this.voteRepository.create(payload.userId, payload.incidentId, payload.voteType);
  }
}
