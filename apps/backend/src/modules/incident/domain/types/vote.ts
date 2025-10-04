export const voteTypes = {
  confirm: 'confirm',
  reject: 'reject',
} as const;

export type VoteType = (typeof voteTypes)[keyof typeof voteTypes];

export interface Vote {
  readonly id: string;
  readonly userId: string;
  readonly incidentId: string;
  readonly voteType: VoteType;
  readonly createdAt: Date;
}
