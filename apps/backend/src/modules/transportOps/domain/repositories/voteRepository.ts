import type { Vote, VoteType } from '../types/vote.ts';

export interface VoteRepository {
  findByUserAndIncident(userId: string, incidentId: string): Promise<Vote | null>;
  create(userId: string, incidentId: string, voteType: VoteType): Promise<Vote>;
  update(voteId: string, voteType: VoteType): Promise<Vote>;
}
