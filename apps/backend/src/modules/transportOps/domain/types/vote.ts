export type VoteType = 'confirm' | 'reject';

export interface Vote {
  readonly id: string;
  readonly userId: string;
  readonly incidentId: string;
  readonly voteType: VoteType;
  readonly createdAt: Date;
}
