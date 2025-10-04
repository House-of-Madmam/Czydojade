export type VehicleType = 'bus' | 'tram';

export interface Line {
  readonly id: string;
  readonly number: string;
  readonly type: VehicleType;
}
