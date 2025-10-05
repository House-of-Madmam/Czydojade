import type { Vote, VoteType } from '../types/vote.ts';

export interface CreateVoteData {
  readonly userId: string;
  readonly incidentId: string;
  readonly voteType: VoteType;
}

export interface VoteRepository {
  create(voteData: CreateVoteData): Promise<Vote>;
  findByUserAndIncident(userId: string, incidentId: string): Promise<Vote | null>;
  countRejectVotesByIncident(incidentId: string): Promise<number>;
  countConfirmVotesByIncident(incidentId: string): Promise<number>;
}
