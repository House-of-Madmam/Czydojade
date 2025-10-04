import { InputNotValidError } from '../../../../common/errors/inputNotValidError.ts';
import type { LoggerService } from '../../../../common/logger/loggerService.ts';
import type { IncidentRepository } from '../../domain/repositories/incidentRepository.ts';
import type { Incident, IncidentType, Priority } from '../../domain/types/incident.ts';

export interface CreateIncidentActionPayload {
  readonly type: IncidentType;
  readonly priority: Priority;
  readonly description?: string | undefined;
  readonly lineId?: string | undefined;
  readonly stopId?: string | undefined;
  readonly latitude?: string | undefined;
  readonly longitude?: string | undefined;
  readonly createdBy: string;
}

export class CreateIncidentAction {
  private readonly incidentRepository: IncidentRepository;
  private readonly loggerService: LoggerService;

  public constructor(incidentRepository: IncidentRepository, loggerService: LoggerService) {
    this.incidentRepository = incidentRepository;
    this.loggerService = loggerService;
  }

  public async execute(payload: CreateIncidentActionPayload): Promise<Incident> {
    this.loggerService.debug({
      message: 'Creating incident...',
      type: payload.type,
      priority: payload.priority,
    });

    const hasLineId = !!payload.lineId;
    const hasStopId = !!payload.stopId;
    const hasLocation = !!payload.latitude && !!payload.longitude;

    if (hasLineId && hasStopId) {
      throw new InputNotValidError({
        reason: 'Incident must have either lineId or stopId, not both',
        value: { lineId: payload.lineId, stopId: payload.stopId },
      });
    }

    if (!hasLineId && !hasStopId) {
      throw new InputNotValidError({
        reason: 'Incident must have either lineId or stopId',
        value: { lineId: payload.lineId, stopId: payload.stopId },
      });
    }

    if (hasLineId && !hasLocation) {
      throw new InputNotValidError({
        reason: 'Incident must have location if lineId is provided',
        value: { lineId: payload.lineId, latitude: payload.latitude, longitude: payload.longitude },
      });
    }

    const incident = await this.incidentRepository.create(payload);

    this.loggerService.info({
      message: 'Incident created successfully.',
      incidentId: incident.id,
    });

    return incident;
  }
}
