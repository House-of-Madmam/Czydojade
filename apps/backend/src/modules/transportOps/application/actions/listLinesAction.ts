import type { LineRepository, ListLinesFilters } from '../../domain/repositories/lineRepository.ts';
import type { Line } from '../../domain/types/line.ts';

export class ListLinesAction {
  public constructor(private readonly lineRepository: LineRepository) {}

  public async execute(filters: ListLinesFilters): Promise<Line[]> {
    return this.lineRepository.list(filters);
  }
}
