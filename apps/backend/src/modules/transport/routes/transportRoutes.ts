/* eslint-disable @typescript-eslint/no-explicit-any */
import type { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
import { Type, type Static } from '@sinclair/typebox';
import type { FastifyInstance } from 'fastify';

import type { Database } from '../../../infrastructure/database/database.ts';
import { ListStopsAction } from '../application/actions/listStopsAction.ts';
import type { ListStopsFilters, PaginatedStops } from '../domain/repositories/stopRepository.ts';
import type { Stop } from '../domain/types/stop.ts';
import { StopRepositoryImpl } from '../infrastructure/repositories/stopRepositoryImpl.ts';

const stopTypeSchema = Type.Union([Type.Literal('bus'), Type.Literal('tram')]);

const stopSchema = Type.Object({
  id: Type.String({ format: 'uuid' }),
  name: Type.String({ minLength: 1, maxLength: 255 }),
  latitude: Type.Number(),
  longitude: Type.Number(),
  type: stopTypeSchema,
});

const paginatedStopsResponseSchema = Type.Object({
  data: Type.Array(stopSchema),
  total: Type.Integer({ minimum: 0 }),
});

type StopResponse = Static<typeof stopSchema>;

type TransportRoutesOptions = {
  database: Database;
};

export async function transportRoutes(
  fastify: FastifyInstance<any, any, any, any, TypeBoxTypeProvider>,
  { database }: TransportRoutesOptions,
): Promise<void> {
  const stopRepository = new StopRepositoryImpl(database);
  const listStopsAction = new ListStopsAction(stopRepository);

  fastify.get('/stops', {
    schema: {
      querystring: Type.Object({
        type: Type.Optional(stopTypeSchema),
        name: Type.Optional(Type.String({ minLength: 1, maxLength: 255 })),
        latitude: Type.Optional(Type.Number()),
        longitude: Type.Optional(Type.Number()),
        radiusMeters: Type.Optional(Type.Integer({ minimum: 1 })),
        page: Type.Optional(Type.Integer({ minimum: 1, default: 1 })),
        pageSize: Type.Optional(Type.Integer({ minimum: 1, maximum: 100, default: 5 })),
      }),
      response: {
        200: paginatedStopsResponseSchema,
      },
    },
    handler: async (request, reply) => {
      const query = request.query as ListStopsFilters;

      // Apply defaults at API layer
      const filters: ListStopsFilters = {
        ...query,
        page: query.page ?? 1,
        pageSize: query.pageSize ?? 5,
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

function mapStopToResponse(stop: Stop): StopResponse {
  return {
    id: stop.id,
    name: stop.name,
    latitude: stop.latitude,
    longitude: stop.longitude,
    type: stop.type,
  };
}
