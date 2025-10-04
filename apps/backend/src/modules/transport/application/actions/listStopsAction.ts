import type { ListStopsFilters, PaginatedStops, StopRepository } from '../../domain/repositories/stopRepository.ts';

export class ListStopsAction {
  public constructor(private readonly stopRepository: StopRepository) {}

  public async execute(filters: ListStopsFilters): Promise<PaginatedStops> {
    return this.stopRepository.list(filters);
  }
}
