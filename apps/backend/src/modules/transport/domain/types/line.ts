export const lineTypes = {
  bus: 'bus',
  tram: 'tram',
} as const;

export type LineType = (typeof lineTypes)[keyof typeof lineTypes];

export interface Line {
  readonly id: string;
  readonly number: string;
  readonly type: LineType;
}
