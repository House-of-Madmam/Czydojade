import type { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
import { Type, type Static } from '@sinclair/typebox';
import type { FastifyInstance } from 'fastify';

import { createAuthenticationMiddleware } from '../../../common/auth/authMiddleware.ts';
import type { TokenService } from '../../../common/auth/tokenService.ts';
import type { Database } from '../../../infrastructure/database/database.ts';
import { CreateAreaSubscriptionAction } from '../application/actions/createAreaSubscriptionAction.ts';
import { CreateIncidentAction, type CreateIncidentActionPayload } from '../application/actions/createIncidentAction.ts';
import { CreateLineSubscriptionAction } from '../application/actions/createLineSubscriptionAction.ts';
import { DeleteSubscriptionAction } from '../application/actions/deleteSubscriptionAction.ts';
import { ListAreaSubscriptionsAction } from '../application/actions/listAreaSubscriptionsAction.ts';
import { ListIncidentsAction } from '../application/actions/listIncidentsAction.ts';
import { ListLineStopsAction } from '../application/actions/listLineStopsAction.ts';
import { ListLineSubscriptionsAction } from '../application/actions/listLineSubscriptionsAction.ts';
import { ListLinesAction } from '../application/actions/listLinesAction.ts';
import { ListStopsAction } from '../application/actions/listStopsAction.ts';
import { VoteIncidentAction } from '../application/actions/voteIncidentAction.ts';
import type { LineStopDetails } from '../domain/repositories/lineRepository.ts';
import type { ListLinesFilters } from '../domain/repositories/lineRepository.ts';
import type { ListIncidentsFilters } from '../domain/repositories/incidentRepository.ts';
import type { ListStopsFilters } from '../domain/repositories/stopRepository.ts';
import type { Incident } from '../domain/types/incident.ts';
import type { Line } from '../domain/types/line.ts';
import type { LineSubscription, AreaSubscription } from '../domain/types/subscription.ts';
import type { Stop } from '../domain/types/stop.ts';
import type { Vote } from '../domain/types/vote.ts';
import { IncidentRepositoryImpl } from '../infrastructure/repositories/incidentRepositoryImpl.ts';
import { LineRepositoryImpl } from '../infrastructure/repositories/lineRepositoryImpl.ts';
import { StopRepositoryImpl } from '../infrastructure/repositories/stopRepositoryImpl.ts';
import { SubscriptionRepositoryImpl } from '../infrastructure/repositories/subscriptionRepositoryImpl.ts';
import { VoteRepositoryImpl } from '../infrastructure/repositories/voteRepositoryImpl.ts';

const vehicleTypeSchema = Type.Union([Type.Literal('bus'), Type.Literal('tram')]);
const prioritySchema = Type.Union([
  Type.Literal('low'),
  Type.Literal('medium'),
  Type.Literal('high'),
  Type.Literal('critical'),
]);
const incidentTypeSchema = Type.Union([Type.Literal('breakdown'), Type.Literal('danger')]);
const voteTypeSchema = Type.Union([Type.Literal('confirm'), Type.Literal('reject')]);

const lineSchema = Type.Object({
  id: Type.String({ format: 'uuid' }),
  number: Type.String({ minLength: 1, maxLength: 50 }),
  type: vehicleTypeSchema,
});

const stopSchema = Type.Object({
  id: Type.String({ format: 'uuid' }),
  name: Type.String({ minLength: 1, maxLength: 255 }),
  latitude: Type.Number(),
  longitude: Type.Number(),
  type: vehicleTypeSchema,
});

const lineStopSchema = Type.Object({
  sequence: Type.Integer({ minimum: 0 }),
  stop: stopSchema,
});

const incidentSchema = Type.Object({
  id: Type.String({ format: 'uuid' }),
  type: incidentTypeSchema,
  priority: prioritySchema,
  startTime: Type.String({ format: 'date-time' }),
  createdAt: Type.String({ format: 'date-time' }),
  createdBy: Type.String({ format: 'uuid' }),
  description: Type.Optional(Type.String()),
  endTime: Type.Optional(Type.String({ format: 'date-time' })),
  lineId: Type.Optional(Type.String({ format: 'uuid' })),
  stopId: Type.Optional(Type.String({ format: 'uuid' })),
  latitude: Type.Optional(Type.Number()),
  longitude: Type.Optional(Type.Number()),
});

const lineSubscriptionSchema = Type.Object({
  id: Type.String({ format: 'uuid' }),
  userId: Type.String({ format: 'uuid' }),
  lineId: Type.String({ format: 'uuid' }),
  minPriority: prioritySchema,
  isActive: Type.Boolean(),
  createdAt: Type.String({ format: 'date-time' }),
});

const areaSubscriptionSchema = Type.Object({
  id: Type.String({ format: 'uuid' }),
  userId: Type.String({ format: 'uuid' }),
  latitude: Type.Number(),
  longitude: Type.Number(),
  radiusMeters: Type.Integer({ minimum: 1 }),
  minPriority: prioritySchema,
  isActive: Type.Boolean(),
  createdAt: Type.String({ format: 'date-time' }),
});

const voteSchema = Type.Object({
  id: Type.String({ format: 'uuid' }),
  userId: Type.String({ format: 'uuid' }),
  incidentId: Type.String({ format: 'uuid' }),
  voteType: voteTypeSchema,
  createdAt: Type.String({ format: 'date-time' }),
});

type LineResponse = Static<typeof lineSchema>;
type StopResponse = Static<typeof stopSchema>;
type LineStopResponse = Static<typeof lineStopSchema>;
type IncidentResponse = Static<typeof incidentSchema>;
type LineSubscriptionResponse = Static<typeof lineSubscriptionSchema>;
type AreaSubscriptionResponse = Static<typeof areaSubscriptionSchema>;
type VoteResponse = Static<typeof voteSchema>;

export async function transportOpsRoutes(
  fastify: FastifyInstance<any, any, any, any, TypeBoxTypeProvider>,
  {
    database,
    tokenService,
  }: {
    database: Database;
    tokenService: TokenService;
  },
): Promise<void> {
  const lineRepository = new LineRepositoryImpl(database);
  const stopRepository = new StopRepositoryImpl(database);
  const incidentRepository = new IncidentRepositoryImpl(database);
  const voteRepository = new VoteRepositoryImpl(database);
  const subscriptionRepository = new SubscriptionRepositoryImpl(database);

  const listLinesAction = new ListLinesAction(lineRepository);
  const listStopsAction = new ListStopsAction(stopRepository);
  const listLineStopsAction = new ListLineStopsAction(lineRepository);
  const listIncidentsAction = new ListIncidentsAction(incidentRepository);
  const createIncidentAction = new CreateIncidentAction(incidentRepository, lineRepository, stopRepository);
  const voteIncidentAction = new VoteIncidentAction(incidentRepository, voteRepository);
  const createLineSubscriptionAction = new CreateLineSubscriptionAction(subscriptionRepository, lineRepository);
  const createAreaSubscriptionAction = new CreateAreaSubscriptionAction(subscriptionRepository);
  const listLineSubscriptionsAction = new ListLineSubscriptionsAction(subscriptionRepository);
  const listAreaSubscriptionsAction = new ListAreaSubscriptionsAction(subscriptionRepository);
  const deleteSubscriptionAction = new DeleteSubscriptionAction(subscriptionRepository);

  const authenticationMiddleware = createAuthenticationMiddleware(tokenService);

  fastify.get('/lines', {
    schema: {
      querystring: Type.Object({
        type: Type.Optional(vehicleTypeSchema),
        number: Type.Optional(Type.String({ minLength: 1, maxLength: 50 })),
      }),
      response: {
        200: Type.Array(lineSchema),
      },
    },
    handler: async (request, reply) => {
      const filters = request.query as ListLinesFilters;

      const lines = await listLinesAction.execute(filters);

      return reply.send(lines.map(mapLineToResponse));
    },
  });

  fastify.get('/stops', {
    schema: {
      querystring: Type.Object({
        type: Type.Optional(vehicleTypeSchema),
        name: Type.Optional(Type.String({ minLength: 1, maxLength: 255 })),
        latitude: Type.Optional(Type.Number()),
        longitude: Type.Optional(Type.Number()),
        radiusMeters: Type.Optional(Type.Integer({ minimum: 1 })),
      }),
      response: {
        200: Type.Array(stopSchema),
      },
    },
    handler: async (request, reply) => {
      const filters = request.query as ListStopsFilters;

      const stops = await listStopsAction.execute(filters);

      return reply.send(stops.map(mapStopToResponse));
    },
  });

  fastify.get('/lines/:lineId/stops', {
    schema: {
      params: Type.Object({
        lineId: Type.String({ format: 'uuid' }),
      }),
      response: {
        200: Type.Array(lineStopSchema),
      },
    },
    handler: async (request, reply) => {
      const { lineId } = request.params as { lineId: string };

      const lineStops = await listLineStopsAction.execute(lineId);

      return reply.send(lineStops.map(mapLineStopToResponse));
    },
  });

  fastify.get('/incidents', {
    schema: {
      querystring: Type.Object({
        lineId: Type.Optional(Type.String({ format: 'uuid' })),
        stopId: Type.Optional(Type.String({ format: 'uuid' })),
        active: Type.Optional(Type.Boolean()),
        priority: Type.Optional(prioritySchema),
      }),
      response: {
        200: Type.Array(incidentSchema),
      },
    },
    handler: async (request, reply) => {
      const { lineId, stopId, active, priority } = request.query as {
        lineId?: string;
        stopId?: string;
        active?: boolean;
        priority?: Incident['priority'];
      };

      const incidentFilters: ListIncidentsFilters = {
        ...(lineId ? { lineId } : {}),
        ...(stopId ? { stopId } : {}),
        ...(active !== undefined ? { isActive: active } : {}),
        ...(priority ? { priority } : {}),
      };

      const incidents = await listIncidentsAction.execute(incidentFilters);

      return reply.send(incidents.map(mapIncidentToResponse));
    },
  });

  fastify.post('/incidents', {
    schema: {
      body: Type.Object({
        type: incidentTypeSchema,
        priority: prioritySchema,
        description: Type.Optional(Type.String({ minLength: 1, maxLength: 2000 })),
        startTime: Type.Optional(Type.String({ format: 'date-time' })),
        endTime: Type.Optional(Type.String({ format: 'date-time' })),
        lineId: Type.Optional(Type.String({ format: 'uuid' })),
        stopId: Type.Optional(Type.String({ format: 'uuid' })),
        latitude: Type.Optional(Type.Number()),
        longitude: Type.Optional(Type.Number()),
      }),
      response: {
        201: incidentSchema,
      },
    },
    preHandler: [authenticationMiddleware],
    handler: async (request, reply) => {
      const userId = (request as typeof request & { user: { userId: string } }).user.userId;
      const body = request.body as {
        type: Incident['type'];
        priority: Incident['priority'];
        description?: string;
        startTime?: string;
        endTime?: string;
        lineId?: string;
        stopId?: string;
        latitude?: number;
        longitude?: number;
      };

      const incidentPayload = {
        type: body.type,
        priority: body.priority,
        createdBy: userId,
        ...(body.description !== undefined ? { description: body.description } : {}),
        ...(body.startTime ? { startTime: new Date(body.startTime) } : {}),
        ...(body.endTime ? { endTime: new Date(body.endTime) } : {}),
        ...(body.lineId !== undefined ? { lineId: body.lineId } : {}),
        ...(body.stopId !== undefined ? { stopId: body.stopId } : {}),
        ...(body.latitude !== undefined ? { latitude: body.latitude } : {}),
        ...(body.longitude !== undefined ? { longitude: body.longitude } : {}),
      } satisfies CreateIncidentActionPayload;

      const incident = await createIncidentAction.execute(incidentPayload);

      return reply.status(201).send(mapIncidentToResponse(incident));
    },
  });

  fastify.post('/incidents/:incidentId/vote', {
    schema: {
      params: Type.Object({
        incidentId: Type.String({ format: 'uuid' }),
      }),
      body: Type.Object({
        voteType: voteTypeSchema,
      }),
      response: {
        200: voteSchema,
      },
    },
    preHandler: [authenticationMiddleware],
    handler: async (request, reply) => {
      const userId = (request as typeof request & { user: { userId: string } }).user.userId;
      const { incidentId } = request.params as { incidentId: string };
      const body = request.body as { voteType: Vote['voteType'] };

      const vote = await voteIncidentAction.execute({
        incidentId,
        userId,
        voteType: body.voteType,
      });

      return reply.send(mapVoteToResponse(vote));
    },
  });

  fastify.post('/subscriptions/line', {
    schema: {
      body: Type.Object({
        lineId: Type.String({ format: 'uuid' }),
        minPriority: prioritySchema,
        isActive: Type.Optional(Type.Boolean()),
      }),
      response: {
        201: lineSubscriptionSchema,
      },
    },
    preHandler: [authenticationMiddleware],
    handler: async (request, reply) => {
      const userId = (request as typeof request & { user: { userId: string } }).user.userId;
      const body = request.body as {
        lineId: string;
        minPriority: LineSubscription['minPriority'];
        isActive?: boolean;
      };

      const lineSubscriptionPayload = {
        userId,
        lineId: body.lineId,
        minPriority: body.minPriority,
        ...(body.isActive !== undefined ? { isActive: body.isActive } : {}),
      } satisfies CreateLineSubscriptionActionPayload;

      const subscription = await createLineSubscriptionAction.execute(lineSubscriptionPayload);

      return reply.status(201).send(mapLineSubscriptionToResponse(subscription));
    },
  });

  fastify.post('/subscriptions/area', {
    schema: {
      body: Type.Object({
        latitude: Type.Number(),
        longitude: Type.Number(),
        radiusMeters: Type.Integer({ minimum: 1 }),
        minPriority: prioritySchema,
        isActive: Type.Optional(Type.Boolean()),
      }),
      response: {
        201: areaSubscriptionSchema,
      },
    },
    preHandler: [authenticationMiddleware],
    handler: async (request, reply) => {
      const userId = (request as typeof request & { user: { userId: string } }).user.userId;
      const body = request.body as {
        latitude: number;
        longitude: number;
        radiusMeters: number;
        minPriority: AreaSubscription['minPriority'];
        isActive?: boolean;
      };

      const subscription = await createAreaSubscriptionAction.execute({
        userId,
        latitude: body.latitude,
        longitude: body.longitude,
        radiusMeters: body.radiusMeters,
        minPriority: body.minPriority,
        isActive: body.isActive,
      });

      return reply.status(201).send(mapAreaSubscriptionToResponse(subscription));
    },
  });

  fastify.get('/subscriptions/line', {
    schema: {
      response: {
        200: Type.Array(lineSubscriptionSchema),
      },
    },
    preHandler: [authenticationMiddleware],
    handler: async (request, reply) => {
      const userId = (request as typeof request & { user: { userId: string } }).user.userId;

      const subscriptions = await listLineSubscriptionsAction.execute(userId);

      return reply.send(subscriptions.map(mapLineSubscriptionToResponse));
    },
  });

  fastify.get('/subscriptions/area', {
    schema: {
      response: {
        200: Type.Array(areaSubscriptionSchema),
      },
    },
    preHandler: [authenticationMiddleware],
    handler: async (request, reply) => {
      const userId = (request as typeof request & { user: { userId: string } }).user.userId;

      const subscriptions = await listAreaSubscriptionsAction.execute(userId);

      return reply.send(subscriptions.map(mapAreaSubscriptionToResponse));
    },
  });

  fastify.delete('/subscriptions/:subscriptionId', {
    schema: {
      params: Type.Object({
        subscriptionId: Type.String({ format: 'uuid' }),
      }),
      response: {
        204: Type.Null(),
      },
    },
    preHandler: [authenticationMiddleware],
    handler: async (request, reply) => {
      const userId = (request as typeof request & { user: { userId: string } }).user.userId;
      const { subscriptionId } = request.params as { subscriptionId: string };

      await deleteSubscriptionAction.execute(subscriptionId, userId);

      return reply.status(204).send();
    },
  });
}

function mapLineToResponse(line: Line): LineResponse {
  return {
    id: line.id,
    number: line.number,
    type: line.type,
  };
}

function mapStopToResponse(stop: Stop): StopResponse {
  return {
    id: stop.id,
    name: stop.name,
    latitude: stop.latitude,
    longitude: stop.longitude,
    type: stop.type,
  };
}

function mapLineStopToResponse(lineStop: LineStopDetails): LineStopResponse {
  return {
    sequence: lineStop.sequence,
    stop: mapStopToResponse(lineStop.stop),
  };
}

function mapIncidentToResponse(incident: Incident): IncidentResponse {
  return {
    id: incident.id,
    type: incident.type,
    priority: incident.priority,
    startTime: incident.startTime.toISOString(),
    createdAt: incident.createdAt.toISOString(),
    createdBy: incident.createdBy,
    ...(incident.description ? { description: incident.description } : {}),
    ...(incident.endTime ? { endTime: incident.endTime.toISOString() } : {}),
    ...(incident.lineId ? { lineId: incident.lineId } : {}),
    ...(incident.stopId ? { stopId: incident.stopId } : {}),
    ...(incident.latitude !== undefined ? { latitude: incident.latitude } : {}),
    ...(incident.longitude !== undefined ? { longitude: incident.longitude } : {}),
  };
}

function mapLineSubscriptionToResponse(subscription: LineSubscription): LineSubscriptionResponse {
  return {
    id: subscription.id,
    userId: subscription.userId,
    lineId: subscription.lineId,
    minPriority: subscription.minPriority,
    isActive: subscription.isActive,
    createdAt: subscription.createdAt.toISOString(),
  };
}

function mapAreaSubscriptionToResponse(subscription: AreaSubscription): AreaSubscriptionResponse {
  return {
    id: subscription.id,
    userId: subscription.userId,
    latitude: subscription.latitude,
    longitude: subscription.longitude,
    radiusMeters: subscription.radiusMeters,
    minPriority: subscription.minPriority,
    isActive: subscription.isActive,
    createdAt: subscription.createdAt.toISOString(),
  };
}

function mapVoteToResponse(vote: Vote): VoteResponse {
  return {
    id: vote.id,
    userId: vote.userId,
    incidentId: vote.incidentId,
    voteType: vote.voteType,
    createdAt: vote.createdAt.toISOString(),
  };
}
