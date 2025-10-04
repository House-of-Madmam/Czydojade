import type { LineRepository, ListLinesFilters, PaginatedLines } from '../../domain/repositories/lineRepository.ts';

export class ListLinesAction {
  private readonly lineRepository: LineRepository;

  public constructor(lineRepository: LineRepository) {
    this.lineRepository = lineRepository;
  }

  public async execute(filters: ListLinesFilters): Promise<PaginatedLines> {
    return this.lineRepository.list(filters);
  }
}
