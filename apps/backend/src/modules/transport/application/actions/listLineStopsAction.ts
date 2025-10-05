import { ResourceNotFoundError } from '../../../../common/errors/resourceNotFoundError.ts';
import type { LineRepository } from '../../domain/repositories/lineRepository.ts';
import type { StopRepository } from '../../domain/repositories/stopRepository.ts';
import type { LineStop } from '../../domain/types/stop.ts';

export class ListLineStopsAction {
  private readonly lineRepository: LineRepository;

  private readonly stopRepository: StopRepository;

  public constructor(lineRepository: LineRepository, stopRepository: StopRepository) {
    this.lineRepository = lineRepository;
    this.stopRepository = stopRepository;
  }

  public async execute(lineId: string): Promise<LineStop[]> {
    const line = await this.lineRepository.findById(lineId);

    if (!line) {
      throw new ResourceNotFoundError({
        resource: 'Line',
        lineId,
      });
    }

    return this.stopRepository.listByLine(lineId);
  }
}
