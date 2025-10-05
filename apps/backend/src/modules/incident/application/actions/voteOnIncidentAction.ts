import { OperationNotValidError } from '../../../../common/errors/operationNotValidError.ts';
import { ResourceNotFoundError } from '../../../../common/errors/resourceNotFoundError.ts';
import type { LoggerService } from '../../../../common/logger/loggerService.ts';
import type { IncidentRepository } from '../../domain/repositories/incidentRepository.ts';
import type { VoteRepository } from '../../domain/repositories/voteRepository.ts';
import type { Vote, VoteType } from '../../domain/types/vote.ts';

export interface VoteOnIncidentActionPayload {
  readonly userId: string;
  readonly incidentId: string;
  readonly voteType: VoteType;
}

export class VoteOnIncidentAction {
  private readonly voteRepository: VoteRepository;
  private readonly incidentRepository: IncidentRepository;
  private readonly loggerService: LoggerService;

  public constructor(
    voteRepository: VoteRepository,
    incidentRepository: IncidentRepository,
    loggerService: LoggerService,
  ) {
    this.voteRepository = voteRepository;
    this.incidentRepository = incidentRepository;
    this.loggerService = loggerService;
  }

  public async execute(payload: VoteOnIncidentActionPayload): Promise<Vote> {
    this.loggerService.debug({
      message: 'User voting on incident...',
      userId: payload.userId,
      incidentId: payload.incidentId,
      voteType: payload.voteType,
    });

    // Check if incident exists
    const incident = await this.incidentRepository.findById(payload.incidentId);

    if (!incident) {
      throw new ResourceNotFoundError({
        resource: 'Incident',
        id: payload.incidentId,
      });
    }

    // Check if incident is still active
    if (incident.endTime) {
      throw new OperationNotValidError({
        reason: 'Cannot vote on a closed incident',
      });
    }

    // Validation: user can only vote once per incident
    const existingVote = await this.voteRepository.findByUserAndIncident(payload.userId, payload.incidentId);

    if (existingVote) {
      throw new OperationNotValidError({
        reason: 'User has already voted on this incident',
      });
    }

    const vote = await this.voteRepository.create({
      userId: payload.userId,
      incidentId: payload.incidentId,
      voteType: payload.voteType,
    });

    this.loggerService.info({
      message: 'Vote created successfully.',
      voteId: vote.id,
      incidentId: payload.incidentId,
    });

    // Auto-close incident if it has >= 5 reject votes
    const rejectCount = await this.voteRepository.countRejectVotesByIncident(payload.incidentId);

    if (rejectCount >= 5) {
      await this.incidentRepository.close(payload.incidentId);

      this.loggerService.info({
        message: 'Incident auto-closed due to reject votes.',
        incidentId: payload.incidentId,
        rejectCount,
      });
    }

    // Extend incident endTime by 1 hour when confirm votes reach multiples of 3
    if (payload.voteType === 'confirm') {
      const confirmCount = await this.voteRepository.countConfirmVotesByIncident(payload.incidentId);

      if (confirmCount % 3 === 0) {
        await this.incidentRepository.extendEndTime(payload.incidentId, 1);

        this.loggerService.info({
          message: 'Incident endTime extended by 1 hour due to confirm votes.',
          incidentId: payload.incidentId,
          confirmCount,
        });
      }
    }

    return vote;
  }
}
