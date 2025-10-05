import { InputNotValidError } from '../../../../common/errors/inputNotValidError.ts';
import type { LoggerService } from '../../../../common/logger/loggerService.ts';
import type { LineRepository } from '../../../transport/domain/repositories/lineRepository.ts';
import type { StopRepository } from '../../../transport/domain/repositories/stopRepository.ts';
import type { IncidentRepository } from '../../domain/repositories/incidentRepository.ts';
import type { Incident, IncidentType, Priority } from '../../domain/types/incident.ts';

export interface CreateIncidentActionPayload {
  readonly type: IncidentType;
  readonly priority: Priority;
  readonly description?: string | undefined;
  readonly lineId?: string | undefined;
  readonly lineDirection?: string | undefined;
  readonly stopId?: string | undefined;
  readonly latitude?: string | undefined;
  readonly longitude?: string | undefined;
  readonly createdBy: string;
}

export class CreateIncidentAction {
  private readonly incidentRepository: IncidentRepository;
  private readonly loggerService: LoggerService;
  private readonly stopRepository: StopRepository;
  private readonly lineRepository: LineRepository;

  public constructor(
    incidentRepository: IncidentRepository,
    stopRepository: StopRepository,
    lineRepository: LineRepository,
    loggerService: LoggerService,
  ) {
    this.incidentRepository = incidentRepository;
    this.stopRepository = stopRepository;
    this.lineRepository = lineRepository;
    this.loggerService = loggerService;
  }

  public async execute(payload: CreateIncidentActionPayload): Promise<Incident> {
    const { type, priority, lineId, stopId, lineDirection, latitude, longitude, createdBy } = payload;

    this.loggerService.debug({
      message: 'Creating incident...',
      type,
      priority,
      lineId,
      stopId,
      lineDirection,
      latitude,
      longitude,
      createdBy,
    });

    const hasLocation = latitude && longitude;

    if (lineId && stopId) {
      throw new InputNotValidError({
        reason: 'Incident must have either lineId or stopId, not both',
        value: { lineId, stopId },
      });
    }

    if (!lineId && !stopId) {
      throw new InputNotValidError({
        reason: 'Incident must have either lineId or stopId',
        value: { lineId, stopId },
      });
    }

    if (lineId && !hasLocation) {
      throw new InputNotValidError({
        reason: 'Incident must have location if lineId is provided',
        value: { lineId, latitude, longitude },
      });
    }

    if (lineId && !lineDirection) {
      throw new InputNotValidError({
        reason: 'Incident must have direction if lineId is provided',
        value: { stopId, lineDirection },
      });
    }

    if (lineId) {
      const line = await this.lineRepository.findById(lineId);

      if (!line) {
        throw new InputNotValidError({
          reason: 'Line not found',
          value: { lineId },
        });
      }
    }

    if (stopId) {
      const stop = await this.stopRepository.findById(stopId);

      if (!stop) {
        throw new InputNotValidError({
          reason: 'Stop not found',
          value: { stopId },
        });
      }
    }

    const incident = await this.incidentRepository.create(payload);

    this.loggerService.info({
      message: 'Incident created successfully.',
      incidentId: incident.id,
      type,
      priority,
      lineId,
      stopId,
      lineDirection,
      latitude,
      longitude,
      createdBy,
    });

    return incident;
  }
}
