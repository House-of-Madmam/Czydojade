import { OperationNotValidError } from '../../../../common/errors/operationNotValidError.ts';
import { ResourceNotFoundError } from '../../../../common/errors/resourceNotFoundError.ts';
import type { CreateIncidentData, IncidentRepository } from '../../domain/repositories/incidentRepository.ts';
import type { LineRepository } from '../../domain/repositories/lineRepository.ts';
import type { StopRepository } from '../../domain/repositories/stopRepository.ts';
import type { Incident } from '../../domain/types/incident.ts';
import type { Priority } from '../../domain/types/priority.ts';
import type { IncidentType } from '../../domain/types/incident.ts';

export interface CreateIncidentActionPayload {
  readonly description?: string;
  readonly type: IncidentType;
  readonly priority: Priority;
  readonly startTime?: Date;
  readonly endTime?: Date | null;
  readonly lineId?: string;
  readonly stopId?: string;
  readonly latitude?: number;
  readonly longitude?: number;
  readonly createdBy: string;
}

export class CreateIncidentAction {
  public constructor(
    private readonly incidentRepository: IncidentRepository,
    private readonly lineRepository: LineRepository,
    private readonly stopRepository: StopRepository,
  ) {}

  public async execute(payload: CreateIncidentActionPayload): Promise<Incident> {
    const hasLine = Boolean(payload.lineId);
    const hasStop = Boolean(payload.stopId);

    if (hasLine === hasStop) {
      throw new OperationNotValidError({
        reason: 'Incident must be linked to exactly one of lineId or stopId.',
      });
    }

    if (payload.lineId) {
      const line = await this.lineRepository.findById(payload.lineId);

      if (!line) {
        throw new ResourceNotFoundError({ resource: 'Line', lineId: payload.lineId });
      }
    }

    if (payload.stopId) {
      const stop = await this.stopRepository.findById(payload.stopId);

      if (!stop) {
        throw new ResourceNotFoundError({ resource: 'Stop', stopId: payload.stopId });
      }
    }

    const createData: CreateIncidentData = {
      ...(payload.description !== undefined ? { description: payload.description } : {}),
      type: payload.type,
      priority: payload.priority,
      ...(payload.startTime ? { startTime: payload.startTime } : {}),
      ...(payload.endTime !== undefined ? { endTime: payload.endTime } : {}),
      ...(payload.lineId !== undefined ? { lineId: payload.lineId } : {}),
      ...(payload.stopId !== undefined ? { stopId: payload.stopId } : {}),
      ...(payload.latitude !== undefined ? { latitude: payload.latitude } : {}),
      ...(payload.longitude !== undefined ? { longitude: payload.longitude } : {}),
      createdBy: payload.createdBy,
    };

    return this.incidentRepository.create(createData);
  }
}
