import type { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
import { Type, type Static } from '@sinclair/typebox';
import type { FastifyInstance } from 'fastify';

import type { Database } from '../../../infrastructure/database/database.ts';
import { ListStopsAction } from '../application/actions/listStopsAction.ts';
import type { ListStopsFilters } from '../domain/repositories/stopRepository.ts';
import type { Stop } from '../domain/types/stop.ts';
import { StopRepositoryImpl } from '../infrastructure/repositories/stopRepositoryImpl.ts';

const vehicleTypeSchema = Type.Union([Type.Literal('bus'), Type.Literal('tram')]);

const stopSchema = Type.Object({
  id: Type.String({ format: 'uuid' }),
  name: Type.String({ minLength: 1, maxLength: 255 }),
  latitude: Type.Number(),
  longitude: Type.Number(),
  type: vehicleTypeSchema,
});

type StopResponse = Static<typeof stopSchema>;

type TransportOpsRoutesOptions = {
  database: Database;
};

export async function transportOpsRoutes(
  fastify: FastifyInstance<any, any, any, any, TypeBoxTypeProvider>,
  { database }: TransportOpsRoutesOptions,
): Promise<void> {
  const stopRepository = new StopRepositoryImpl(database);
  const listStopsAction = new ListStopsAction(stopRepository);

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
