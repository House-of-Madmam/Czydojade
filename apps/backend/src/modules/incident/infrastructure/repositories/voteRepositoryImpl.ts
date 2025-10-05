import { and, eq } from 'drizzle-orm';

import { UuidService } from '../../../../common/uuid/uuidService.ts';
import type { Database } from '../../../../infrastructure/database/database.ts';
import { votes } from '../../../../infrastructure/database/schema.ts';
import type { CreateVoteData, VoteRepository } from '../../domain/repositories/voteRepository.ts';
import type { Vote, VoteType } from '../../domain/types/vote.ts';

export class VoteRepositoryImpl implements VoteRepository {
  private readonly database: Database;

  public constructor(database: Database) {
    this.database = database;
  }

  public async create(voteData: CreateVoteData): Promise<Vote> {
    const [newVote] = await this.database.db
      .insert(votes)
      .values({
        id: UuidService.generateUuid(),
        userId: voteData.userId,
        incidentId: voteData.incidentId,
        voteType: voteData.voteType,
      })
      .returning();

    if (!newVote) {
      throw new Error('Failed to create vote');
    }

    return this.mapToVote(newVote);
  }

  public async findByUserAndIncident(userId: string, incidentId: string): Promise<Vote | null> {
    const [vote] = await this.database.db
      .select()
      .from(votes)
      .where(and(eq(votes.userId, userId), eq(votes.incidentId, incidentId)))
      .limit(1);

    return vote ? this.mapToVote(vote) : null;
  }

  public async countRejectVotesByIncident(incidentId: string): Promise<number> {
    const result = await this.database.db
      .select()
      .from(votes)
      .where(and(eq(votes.incidentId, incidentId), eq(votes.voteType, 'reject')));

    return result.length;
  }

  public async countConfirmVotesByIncident(incidentId: string): Promise<number> {
    const result = await this.database.db
      .select()
      .from(votes)
      .where(and(eq(votes.incidentId, incidentId), eq(votes.voteType, 'confirm')));

    return result.length;
  }

  private mapToVote(dbVote: typeof votes.$inferSelect): Vote {
    const vote: Vote = {
      id: dbVote.id,
      userId: dbVote.userId,
      incidentId: dbVote.incidentId,
      voteType: dbVote.voteType as VoteType,
      createdAt: dbVote.createdAt,
    };

    return vote;
  }
}
