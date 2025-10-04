import type { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
import { Type, type Static } from '@sinclair/typebox';
import type { FastifyInstance } from 'fastify';

import { createAuthenticationMiddleware } from '../../../common/auth/authMiddleware.ts';
import type { TokenService } from '../../../common/auth/tokenService.ts';
import type { LoggerService } from '../../../common/logger/loggerService.ts';
import type { Database } from '../../../infrastructure/database/database.ts';
import { CreateIncidentAction } from '../application/actions/createIncidentAction.ts';
import { FindIncidentsAction } from '../application/actions/findIncidentsAction.ts';
import { VoteOnIncidentAction } from '../application/actions/voteOnIncidentAction.ts';
import type { Incident, IncidentWithVotes } from '../domain/types/incident.ts';
import type { Vote } from '../domain/types/vote.ts';
import { IncidentRepositoryImpl } from '../infrastructure/repositories/incidentRepositoryImpl.ts';
import { VoteRepositoryImpl } from '../infrastructure/repositories/voteRepositoryImpl.ts';

const incidentTypes = Type.Union([
  Type.Literal('vehicleBreakdown'),
  Type.Literal('infrastructureBreakdown'),
  Type.Literal('dangerInsideVehicle'),
]);

const priorities = Type.Union([
  Type.Literal('low'),
  Type.Literal('medium'),
  Type.Literal('high'),
  Type.Literal('critical'),
]);

const incidentSchema = Type.Object({
  id: Type.String({ format: 'uuid' }),
  description: Type.Union([Type.String(), Type.Null()]),
  type: incidentTypes,
  priority: priorities,
  startTime: Type.String({ format: 'date-time' }),
  endTime: Type.Union([Type.String({ format: 'date-time' }), Type.Null()]),
  lineId: Type.Union([Type.String({ format: 'uuid' }), Type.Null()]),
  stopId: Type.Union([Type.String({ format: 'uuid' }), Type.Null()]),
  latitude: Type.Union([Type.String(), Type.Null()]),
  longitude: Type.Union([Type.String(), Type.Null()]),
  createdBy: Type.String({ format: 'uuid' }),
  createdAt: Type.String({ format: 'date-time' }),
});

const incidentWithVotesSchema = Type.Intersect([
  incidentSchema,
  Type.Object({
    confirmVotes: Type.Integer({ minimum: 0 }),
    rejectVotes: Type.Integer({ minimum: 0 }),
  }),
]);

const paginatedIncidentsSchema = Type.Object({
  data: Type.Array(incidentWithVotesSchema),
  total: Type.Integer({ minimum: 0 }),
});

const voteSchema = Type.Object({
  id: Type.String({ format: 'uuid' }),
  userId: Type.String({ format: 'uuid' }),
  incidentId: Type.String({ format: 'uuid' }),
  voteType: Type.Union([Type.Literal('confirm'), Type.Literal('reject')]),
  createdAt: Type.String({ format: 'date-time' }),
});

export async function incidentRoutes(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fastify: FastifyInstance<any, any, any, any, TypeBoxTypeProvider>,
  {
    tokenService,
    loggerService,
    database,
  }: {
    database: Database;
    loggerService: LoggerService;
    tokenService: TokenService;
  },
): Promise<void> {
  const mapIncidentToResponse = (incident: Incident): Static<typeof incidentSchema> => {
    const incidentResponse: Static<typeof incidentSchema> = {
      id: incident.id,
      description: incident.description,
      type: incident.type,
      priority: incident.priority,
      startTime: incident.startTime.toISOString(),
      endTime: incident.endTime ? incident.endTime.toISOString() : null,
      lineId: incident.lineId,
      stopId: incident.stopId,
      latitude: incident.latitude,
      longitude: incident.longitude,
      createdBy: incident.createdBy,
      createdAt: incident.createdAt.toISOString(),
    };

    return incidentResponse;
  };

  const mapIncidentWithVotesToResponse = (incident: IncidentWithVotes): Static<typeof incidentWithVotesSchema> => {
    const incidentResponse: Static<typeof incidentWithVotesSchema> = {
      id: incident.id,
      description: incident.description,
      type: incident.type,
      priority: incident.priority,
      startTime: incident.startTime.toISOString(),
      endTime: incident.endTime ? incident.endTime.toISOString() : null,
      lineId: incident.lineId,
      stopId: incident.stopId,
      latitude: incident.latitude,
      longitude: incident.longitude,
      createdBy: incident.createdBy,
      createdAt: incident.createdAt.toISOString(),
      confirmVotes: incident.confirmVotes,
      rejectVotes: incident.rejectVotes,
    };

    return incidentResponse;
  };

  const mapVoteToResponse = (vote: Vote): Static<typeof voteSchema> => {
    const voteResponse: Static<typeof voteSchema> = {
      id: vote.id,
      userId: vote.userId,
      incidentId: vote.incidentId,
      voteType: vote.voteType,
      createdAt: vote.createdAt.toISOString(),
    };

    return voteResponse;
  };

  const incidentRepository = new IncidentRepositoryImpl(database);
  const voteRepository = new VoteRepositoryImpl(database);

  const createIncidentAction = new CreateIncidentAction(incidentRepository, loggerService);
  const findIncidentsAction = new FindIncidentsAction(incidentRepository);
  const voteOnIncidentAction = new VoteOnIncidentAction(voteRepository, incidentRepository, loggerService);

  const authenticationMiddleware = createAuthenticationMiddleware(tokenService);

  // GET /incidents - lista incydentów, filtry: linia, przystanek, aktywne, priorytet, lokalizacja, paginacja
  fastify.get('/incidents', {
    schema: {
      querystring: Type.Object({
        lineId: Type.Optional(Type.String({ format: 'uuid' })),
        stopId: Type.Optional(Type.String({ format: 'uuid' })),
        isActive: Type.Optional(Type.Boolean()),
        priority: Type.Optional(
          Type.Union([Type.Literal('low'), Type.Literal('medium'), Type.Literal('high'), Type.Literal('critical')]),
        ),
        latitude: Type.Optional(Type.String()),
        longitude: Type.Optional(Type.String()),
        page: Type.Optional(Type.Integer({ minimum: 1, default: 1 })),
        limit: Type.Optional(Type.Integer({ minimum: 1, maximum: 100, default: 10 })),
      }),
      response: {
        200: paginatedIncidentsSchema,
      },
    },
    handler: async (request, reply) => {
      const result = await findIncidentsAction.execute(request.query);

      return reply.send({
        data: result.data.map(mapIncidentWithVotesToResponse),
        total: result.total,
      });
    },
  });

  fastify.post('/incidents', {
    schema: {
      body: Type.Object({
        description: Type.Optional(Type.String({ minLength: 1, maxLength: 1000 })),
        type: incidentTypes,
        priority: priorities,
        stopId: Type.Optional(Type.String({ format: 'uuid' })),
        // if stopId is provided, lineId, latitude and longitude are not used
        lineId: Type.Optional(Type.String({ format: 'uuid' })),
        latitude: Type.Optional(Type.String()),
        longitude: Type.Optional(Type.String()),
      }),
      response: {
        201: incidentSchema,
      },
    },
    preHandler: [authenticationMiddleware],
    handler: async (request, reply) => {
      const userId = (request as typeof request & { user: { userId: string } }).user.userId;

      const incident = await createIncidentAction.execute({
        ...request.body,
        createdBy: userId,
      });

      return reply.status(201).send(mapIncidentToResponse(incident));
    },
  });

  fastify.post('/incidents/:incidentId/vote', {
    schema: {
      params: Type.Object({
        incidentId: Type.String({ format: 'uuid' }),
      }),
      body: Type.Object({
        voteType: Type.Union([Type.Literal('confirm'), Type.Literal('reject')]),
      }),
      response: {
        201: voteSchema,
      },
    },
    preHandler: [authenticationMiddleware],
    handler: async (request, reply) => {
      const userId = (request as typeof request & { user: { userId: string } }).user.userId;

      const vote = await voteOnIncidentAction.execute({
        userId,
        incidentId: request.params.incidentId,
        voteType: request.body.voteType,
      });

      return reply.status(201).send(mapVoteToResponse(vote));
    },
  });
}
