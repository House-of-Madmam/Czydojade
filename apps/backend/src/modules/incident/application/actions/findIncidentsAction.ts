import type { IncidentRepository, PaginatedIncidents } from '../../domain/repositories/incidentRepository.ts';
import type { Priority } from '../../domain/types/incident.ts';

export interface FindIncidentsActionPayload {
  readonly lineId?: string | undefined;
  readonly lineDirection?: string | undefined;
  readonly stopId?: string | undefined;
  readonly isActive?: boolean | undefined;
  readonly priority?: Priority | undefined;
  readonly latitude?: number | undefined;
  readonly longitude?: number | undefined;
  readonly radiusMeters?: number | undefined;
  readonly page?: number | undefined;
  readonly limit?: number | undefined;
}

export class FindIncidentsAction {
  private readonly incidentRepository: IncidentRepository;

  public constructor(incidentRepository: IncidentRepository) {
    this.incidentRepository = incidentRepository;
  }

  public async execute(payload: FindIncidentsActionPayload): Promise<PaginatedIncidents> {
    return this.incidentRepository.findManyWithVotes(payload);
  }
}
