/* eslint-disable @typescript-eslint/no-explicit-any */
import type { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
import { Type, type Static } from '@sinclair/typebox';
import type { FastifyInstance } from 'fastify';

import type { Database } from '../../../infrastructure/database/database.ts';
import { ListLineStopsAction } from '../application/actions/listLineStopsAction.ts';
import { ListLinesAction } from '../application/actions/listLinesAction.ts';
import { ListStopsAction } from '../application/actions/listStopsAction.ts';
import type { LineRepository, ListLinesFilters, PaginatedLines } from '../domain/repositories/lineRepository.ts';
import type { ListStopsFilters, PaginatedStops } from '../domain/repositories/stopRepository.ts';
import type { Line } from '../domain/types/line.ts';
import { stopTypes, type LineStop, type Stop } from '../domain/types/stop.ts';
import { LineRepositoryImpl } from '../infrastructure/repositories/lineRepositoryImpl.ts';
import { StopRepositoryImpl } from '../infrastructure/repositories/stopRepositoryImpl.ts';

const vehicleTypeSchema = Type.Union([Type.Literal('bus'), Type.Literal('tram')]);
const stopTypeSchema = vehicleTypeSchema;

const lineSchema = Type.Object({
  id: Type.String({ format: 'uuid' }),
  number: Type.String({ minLength: 1, maxLength: 50 }),
  type: vehicleTypeSchema,
  directions: Type.Array(Type.String()),
});

const stopSchema = Type.Object({
  id: Type.String({ format: 'uuid' }),
  name: Type.String({ minLength: 1, maxLength: 255 }),
  latitude: Type.Number(),
  longitude: Type.Number(),
  type: stopTypeSchema,
});

const paginatedLinesResponseSchema = Type.Object({
  data: Type.Array(lineSchema),
  total: Type.Integer({ minimum: 0 }),
});

const paginatedStopsResponseSchema = Type.Object({
  data: Type.Array(stopSchema),
  total: Type.Integer({ minimum: 0 }),
});

const lineStopSchema = Type.Object({
  sequence: Type.Integer({ minimum: 0 }),
  stop: stopSchema,
});

const lineStopsResponseSchema = Type.Object({
  data: Type.Array(lineStopSchema),
  total: Type.Integer({ minimum: 0 }),
});

type LineResponse = Static<typeof lineSchema>;
type StopResponse = Static<typeof stopSchema>;
type LineStopResponse = Static<typeof lineStopSchema>;

type TransportRoutesOptions = {
  database: Database;
};

export async function transportRoutes(
  fastify: FastifyInstance<any, any, any, any, TypeBoxTypeProvider>,
  { database }: TransportRoutesOptions,
): Promise<void> {
  const stopRepository = new StopRepositoryImpl(database);
  const listStopsAction = new ListStopsAction(stopRepository);

  const lineRepository: LineRepository = new LineRepositoryImpl(database);
  const listLinesAction = new ListLinesAction(lineRepository);
  const listLineStopsAction = new ListLineStopsAction(lineRepository, stopRepository);

  fastify.get('/lines', {
    schema: {
      querystring: Type.Object({
        type: Type.Optional(vehicleTypeSchema),
        number: Type.Optional(Type.String({ minLength: 1, maxLength: 50 })),
        page: Type.Optional(Type.Integer({ minimum: 1, default: 1 })),
        pageSize: Type.Optional(Type.Integer({ minimum: 1, maximum: 100 })),
      }),
      response: {
        200: paginatedLinesResponseSchema,
      },
    },
    handler: async (request, reply) => {
      const query = request.query as ListLinesFilters;

      const filters: ListLinesFilters = {
        ...query,
        page: query.page ?? 1,
        pageSize: query.pageSize ?? 10,
      };

      const paginatedLines: PaginatedLines = await listLinesAction.execute(filters);
      const mappedData: LineResponse[] = paginatedLines.data.map((line: Line) => mapLineToResponse(line));

      return reply.send({
        data: mappedData,
        total: paginatedLines.total,
      });
    },
  });

  fastify.get('/lines/:lineId/stops', {
    schema: {
      params: Type.Object({
        lineId: Type.String({ format: 'uuid' }),
      }),
      response: {
        200: lineStopsResponseSchema,
      },
    },
    handler: async (request, reply) => {
      const { lineId } = request.params as { lineId: string };

      const lineStops = await listLineStopsAction.execute(lineId);
      const mappedData: LineStopResponse[] = lineStops.map((lineStop: LineStop) => mapLineStopToResponse(lineStop));

      return reply.send({
        data: mappedData,
        total: mappedData.length,
      });
    },
  });

  fastify.get('/stops', {
    schema: {
      querystring: Type.Object({
        type: Type.Optional(stopTypeSchema),
        name: Type.Optional(Type.String({ minLength: 1, maxLength: 255 })),
        latitude: Type.Optional(Type.Number()),
        longitude: Type.Optional(Type.Number()),
        radiusMeters: Type.Optional(Type.Integer({ minimum: 1 })),
        page: Type.Optional(Type.Integer({ minimum: 1, default: 1 })),
        pageSize: Type.Optional(Type.Integer({ minimum: 1, maximum: 100 })),
      }),
      response: {
        200: paginatedStopsResponseSchema,
      },
    },
    handler: async (request, reply) => {
      const query = request.query as ListStopsFilters;

      const filters: ListStopsFilters = {
        ...query,
        page: query.page ?? 1,
        pageSize: query.pageSize ?? 10,
        type: query.type ?? stopTypes.tram,
      };

      const paginatedStops: PaginatedStops = await listStopsAction.execute(filters);
      const mappedData: StopResponse[] = paginatedStops.data.map((stop: Stop) => mapStopToResponse(stop));

      return reply.send({
        data: mappedData,
        total: paginatedStops.total,
      });
    },
  });
}

function mapLineStopToResponse(lineStop: LineStop): LineStopResponse {
  return {
    sequence: lineStop.sequence,
    stop: mapStopToResponse(lineStop.stop),
  };
}

function mapLineToResponse(line: Line): LineResponse {
  return {
    id: line.id,
    number: line.number,
    type: line.type,
    directions: line.directions,
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
