import { boolean, decimal, index, integer, pgEnum, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';

export const vehicleTypeEnum = pgEnum('vehicle_type', ['bus', 'tram']);
export const stopTypeEnum = pgEnum('stop_type', ['bus', 'tram']);
export const incidentTypeEnum = pgEnum('incident_type', [
  'vehicleBreakdown',
  'infrastructureBreakdown',
  'dangerInsideVehicle',
]);
export const priorityEnum = pgEnum('priority', ['low', 'medium', 'high', 'critical']);
export const voteTypeEnum = pgEnum('vote_type', ['confirm', 'reject']);
export const roleEnum = pgEnum('role', ['user', 'admin']);

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: text('password').notNull(),
  role: roleEnum('role').notNull().default('user'),
});

export const blacklistedTokens = pgTable('blacklisted_tokens', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  tokenHash: text('token_hash').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
});

export const lines = pgTable(
  'lines',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    number: varchar('number', { length: 50 }).notNull(),
    type: vehicleTypeEnum('type').notNull(),
  },
  (table) => [index('lines_number_type_idx').on(table.number, table.type)],
);

export const stops = pgTable(
  'stops',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 255 }).notNull(),
    latitude: decimal('latitude', { precision: 10, scale: 7 }).notNull(),
    longitude: decimal('longitude', { precision: 10, scale: 7 }).notNull(),
    type: stopTypeEnum('type').notNull(),
  },
  (table) => [index('stops_lat_lon_idx').on(table.latitude, table.longitude), index('stops_name_idx').on(table.name)],
);

export const lineStops = pgTable(
  'line_stops',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    lineId: uuid('line_id')
      .notNull()
      .references(() => lines.id, { onDelete: 'cascade' }),
    stopId: uuid('stop_id')
      .notNull()
      .references(() => stops.id, { onDelete: 'cascade' }),
    sequence: integer('sequence').notNull(), // kolejność
  },
  (table) => [index('line_stops_line_id_idx').on(table.lineId), index('line_stops_stop_id_idx').on(table.stopId)],
);

export const incidents = pgTable(
  'incidents',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    description: text('description'),
    type: incidentTypeEnum('type').notNull(),
    priority: priorityEnum('priority').notNull(),
    startTime: timestamp('start_time').notNull().defaultNow(),
    endTime: timestamp('end_time'),
    // Foreign keys - ALBO linia ALBO przystanek
    lineId: uuid('line_id').references(() => lines.id, { onDelete: 'cascade' }),
    stopId: uuid('stop_id').references(() => stops.id, { onDelete: 'cascade' }),
    // Opcjonalna lokalizacja geograficzna
    latitude: decimal('latitude', { precision: 10, scale: 7 }),
    longitude: decimal('longitude', { precision: 10, scale: 7 }),
    createdBy: uuid('created_by')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    index('incidents_line_id_idx').on(table.lineId),
    index('incidents_stop_id_idx').on(table.stopId),
    index('incidents_active_idx').on(table.endTime),
    index('incidents_created_at_idx').on(table.createdAt),
  ],
);

export const votes = pgTable(
  'votes',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    incidentId: uuid('incident_id')
      .notNull()
      .references(() => incidents.id, { onDelete: 'cascade' }),
    voteType: voteTypeEnum('vote_type').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    index('votes_user_incident_idx').on(table.userId, table.incidentId),
    index('votes_incident_id_idx').on(table.incidentId),
  ],
);

export const lineSubscriptions = pgTable(
  'line_subscriptions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    lineId: uuid('line_id')
      .notNull()
      .references(() => lines.id, { onDelete: 'cascade' }),
    minPriority: priorityEnum('min_priority').notNull().default('low'),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    index('line_subscriptions_user_id_idx').on(table.userId),
    index('line_subscriptions_line_id_idx').on(table.lineId),
  ],
);

export const areaSubscriptions = pgTable(
  'area_subscriptions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    latitude: decimal('latitude', { precision: 10, scale: 7 }).notNull(),
    longitude: decimal('longitude', { precision: 10, scale: 7 }).notNull(),
    radiusMeters: integer('radius_meters').notNull(),
    minPriority: priorityEnum('min_priority').notNull().default('low'),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    index('area_subscriptions_user_id_idx').on(table.userId),
    index('area_subscriptions_lat_lon_idx').on(table.latitude, table.longitude),
  ],
);
