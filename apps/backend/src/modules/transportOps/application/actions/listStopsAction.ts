import type { ListStopsFilters, StopRepository } from '../../domain/repositories/stopRepository.ts';
import type { Stop } from '../../domain/types/stop.ts';

export class ListStopsAction {
  public constructor(private readonly stopRepository: StopRepository) {}

  public async execute(filters: ListStopsFilters): Promise<Stop[]> {
    return this.stopRepository.list(filters);
  }
}
