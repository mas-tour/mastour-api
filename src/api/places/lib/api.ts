import { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import { Places, PlacesSchema, addErrorSchemas } from '../../../schema';
import { sendResult } from '../../error-handling';
import * as data from './data';

const placesRoute: FastifyPluginAsync = async (fastify) => {
  fastify.get<{
    Reply: Places['readMany']['response'];
  }>(
    `${PlacesSchema.path}`,
    {
      schema: {
        tags: ['places', 'readMany'],
        response: addErrorSchemas({ 200: PlacesSchema.readMany.response }),
        security: [{ bearerAuth: [] }],
      },
    },
    async (_request, reply) => {
      const result = await data.readMany(fastify.db);

      sendResult(result, reply, 200);
    }
  );
};

export const placesPlugin = fp(placesRoute, {
  fastify: '4.x',
  name: 'mastour-places',
});
