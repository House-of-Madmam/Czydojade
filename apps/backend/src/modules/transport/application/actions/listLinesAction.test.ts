import { describe, expect, it, vi } from 'vitest';

import type { LineRepository, ListLinesFilters, PaginatedLines } from '../../domain/repositories/lineRepository.ts';
import type { Line } from '../../domain/types/line.ts';

import { ListLinesAction } from './listLinesAction.ts';

describe('ListLinesAction', () => {
  it('returns lines from repository with provided filters', async () => {
    const filters: ListLinesFilters = { type: 'tram', number: 'A', page: 2, pageSize: 5 };
    const lines: Line[] = [
      {
        id: '1c1391b0-4d4e-4db1-8c32-8df1c4f0c5a3',
        number: 'A1',
        type: 'tram',
      },
    ];
    const expectedResult: PaginatedLines = { data: lines, total: 1 };

    const lineRepository: LineRepository = {
      list: vi.fn().mockResolvedValue(expectedResult),
    };

    const action = new ListLinesAction(lineRepository);

    const result = await action.execute(filters);

    expect(lineRepository.list).toHaveBeenCalledWith(filters);
    expect(result).toEqual(expectedResult);
  });
});
