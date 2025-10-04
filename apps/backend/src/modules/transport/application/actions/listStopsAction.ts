import type { ListStopsFilters, PaginatedStops, StopRepository } from '../../domain/repositories/stopRepository.ts';

export class ListStopsAction {
  private readonly stopRepository: StopRepository;

  public constructor(stopRepository: StopRepository) {
    this.stopRepository = stopRepository;
  }

  public async execute(filters: ListStopsFilters): Promise<PaginatedStops> {
    return this.stopRepository.list(filters);
  }
}
