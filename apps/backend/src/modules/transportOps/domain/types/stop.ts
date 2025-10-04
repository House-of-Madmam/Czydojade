export type StopType = 'bus' | 'tram';

export interface Stop {
  readonly id: string;
  readonly name: string;
  readonly latitude: number;
  readonly longitude: number;
  readonly type: StopType;
}
