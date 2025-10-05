import { describe, expect, it, vi } from 'vitest';

import { ResourceNotFoundError } from '../../../../common/errors/resourceNotFoundError.ts';
import type { LineRepository } from '../../domain/repositories/lineRepository.ts';
import type { StopRepository } from '../../domain/repositories/stopRepository.ts';
import type { Line } from '../../domain/types/line.ts';
import type { LineStop } from '../../domain/types/stop.ts';

import { ListLineStopsAction } from './listLineStopsAction.ts';

describe('ListLineStopsAction', () => {
  it('returns ordered stops for an existing line', async () => {
    const lineId = '16d3a4df-94bc-4f56-9cc6-cb07d89b3d60';
    const line: Line = {
      id: lineId,
      number: '24',
      type: 'tram',
      directions: ['Kurdwanów', 'Bronowice Małe'],
    };

    const stops: LineStop[] = [
      {
        sequence: 1,
        stop: {
          id: '01c90511-56b4-40f4-8dc6-4e36f8178f48',
          name: 'Kurdwanów',
          latitude: 50.0001,
          longitude: 19.9445,
          type: 'tram',
        },
      },
      {
        sequence: 2,
        stop: {
          id: '88d43cc7-2ff4-4cb7-9f88-3bd9bb9c8bf5',
          name: 'Wieloński',
          latitude: 50.0048,
          longitude: 19.9452,
          type: 'tram',
        },
      },
    ];

    const lineRepository: LineRepository = {
      list: vi.fn(),
      findById: vi.fn().mockResolvedValue(line),
    };
    const stopRepository: StopRepository = {
      list: vi.fn(),
      listByLine: vi.fn().mockResolvedValue(stops),
      findById: vi.fn(),
    };

    const action = new ListLineStopsAction(lineRepository, stopRepository);

    const result = await action.execute(lineId);

    expect(lineRepository.findById).toHaveBeenCalledWith(lineId);
    expect(stopRepository.listByLine).toHaveBeenCalledWith(lineId);
    expect(result).toEqual(stops);
  });

  it('throws ResourceNotFoundError when line does not exist', async () => {
    const lineId = 'd2824863-7a6a-4c55-bb39-3bf5a273b7f1';

    const lineRepository: LineRepository = {
      list: vi.fn(),
      findById: vi.fn().mockResolvedValue(null),
    };
    const stopRepository: StopRepository = {
      list: vi.fn(),
      listByLine: vi.fn(),
      findById: vi.fn(),
    };

    const action = new ListLineStopsAction(lineRepository, stopRepository);

    await expect(action.execute(lineId)).rejects.toThrow(ResourceNotFoundError);
    expect(stopRepository.listByLine).not.toHaveBeenCalled();
  });
});
