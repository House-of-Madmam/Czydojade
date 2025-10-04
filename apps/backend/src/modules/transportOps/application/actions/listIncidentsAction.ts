import type { IncidentRepository, ListIncidentsFilters } from '../../domain/repositories/incidentRepository.ts';
import type { Incident } from '../../domain/types/incident.ts';

export class ListIncidentsAction {
  public constructor(private readonly incidentRepository: IncidentRepository) {}

  public async execute(filters: ListIncidentsFilters): Promise<Incident[]> {
    return this.incidentRepository.list(filters);
  }
}
