import { and, eq } from 'drizzle-orm';

import { UuidService } from '../../../../common/uuid/uuidService.ts';
import type { Database } from '../../../../infrastructure/database/database.ts';
import { votes } from '../../../../infrastructure/database/schema.ts';
import type { VoteRepository } from '../../domain/repositories/voteRepository.ts';
import type { Vote } from '../../domain/types/vote.ts';

export class VoteRepositoryImpl implements VoteRepository {
  public constructor(private readonly database: Database) {}

  public async findByUserAndIncident(userId: string, incidentId: string): Promise<Vote | null> {
    const [row] = await this.database.db
      .select()
      .from(votes)
      .where(and(eq(votes.userId, userId), eq(votes.incidentId, incidentId)))
      .limit(1);

    return row ? this.mapVote(row) : null;
  }

  public async create(userId: string, incidentId: string, voteType: Vote['voteType']): Promise<Vote> {
    const [row] = await this.database.db
      .insert(votes)
      .values({
        id: UuidService.generateUuid(),
        userId,
        incidentId,
        voteType,
      })
      .returning();

    if (!row) {
      throw new Error('Failed to create vote');
    }

    return this.mapVote(row);
  }

  public async update(voteId: string, voteType: Vote['voteType']): Promise<Vote> {
    const [row] = await this.database.db.update(votes).set({ voteType }).where(eq(votes.id, voteId)).returning();

    if (!row) {
      throw new Error('Failed to update vote');
    }

    return this.mapVote(row);
  }

  private mapVote(row: typeof votes.$inferSelect): Vote {
    return {
      id: row.id,
      userId: row.userId,
      incidentId: row.incidentId,
      voteType: row.voteType,
      createdAt: row.createdAt,
    };
  }
}
