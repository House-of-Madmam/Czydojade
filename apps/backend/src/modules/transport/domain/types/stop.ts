export const stopTypes = {
  bus: 'bus',
  tram: 'tram',
} as const;

export type StopType = (typeof stopTypes)[keyof typeof stopTypes];

export interface Stop {
  readonly id: string;
  readonly name: string;
  readonly latitude: number;
  readonly longitude: number;
  readonly type: StopType;
}

export interface LineStop {
  readonly sequence: number;
  readonly stop: Stop;
}
