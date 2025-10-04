import { and, asc, count, eq, ilike, type SQL } from 'drizzle-orm';

import type { Database } from '../../../../infrastructure/database/database.ts';
import { lines } from '../../../../infrastructure/database/schema.ts';
import type { Line } from '../../domain/types/line.ts';
import type { LineRepository, ListLinesFilters, PaginatedLines } from '../../domain/repositories/lineRepository.ts';

export class LineRepositoryImpl implements LineRepository {
  private readonly database: Database;

  public constructor(database: Database) {
    this.database = database;
  }

  public async list(filters: ListLinesFilters): Promise<PaginatedLines> {
    const conditions: SQL[] = [];

    if (filters.type) {
      conditions.push(eq(lines.type, filters.type));
    }

    if (filters.number) {
      conditions.push(ilike(lines.number, `%${filters.number}%`));
    }

    const page = filters.page ?? 1;
    const pageSize = filters.pageSize ?? 10;
    const offset = (page - 1) * pageSize;

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const countQuery = this.database.db.select({ count: count() }).from(lines);
    const countResult = await (whereClause ? countQuery.where(whereClause) : countQuery);
    const total = countResult[0]?.count ?? 0;

    const dataQuery = this.database.db.select().from(lines);
    const filteredQuery = whereClause ? dataQuery.where(whereClause) : dataQuery;

    const result = await filteredQuery.orderBy(asc(lines.number)).limit(pageSize).offset(offset);

    const data = result.map((row) => this.mapLine(row));

    return {
      data,
      total,
    };
  }

  private mapLine(row: typeof lines.$inferSelect): Line {
    return {
      id: row.id,
      number: row.number,
      type: row.type,
      directions: row.directions ?? [],
    };
  }
}
