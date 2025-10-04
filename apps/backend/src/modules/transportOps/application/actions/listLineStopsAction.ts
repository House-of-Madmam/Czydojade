import { ResourceNotFoundError } from '../../../../common/errors/resourceNotFoundError.ts';
import type { LineRepository } from '../../domain/repositories/lineRepository.ts';
import type { LineStopDetails } from '../../domain/repositories/lineRepository.ts';

export class ListLineStopsAction {
  public constructor(private readonly lineRepository: LineRepository) {}

  public async execute(lineId: string): Promise<LineStopDetails[]> {
    const line = await this.lineRepository.findById(lineId);

    if (!line) {
      throw new ResourceNotFoundError({
        resource: 'Line',
        lineId,
      });
    }

    return this.lineRepository.listStops(lineId);
  }
}
