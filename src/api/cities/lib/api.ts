import { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import { Cities, CitiesSchema, addErrorSchemas } from '../../../schema';
import { sendResult } from '../../error-handling';
import * as data from './data';

const citiesRoute: FastifyPluginAsync = async (fastify) => {
  fastify.get<{
    Reply: Cities['readMany']['response'];
  }>(
    `${CitiesSchema.path}`,
    {
      schema: {
        tags: ['cities', 'readMany'],
        response: addErrorSchemas({ 200: CitiesSchema.readMany.response }),
        security: [{ bearerAuth: [] }],
      },
    },
    async (_request, reply) => {
      const result = await data.readMany(fastify.db);

      sendResult(result, reply, 200);
    }
  );
};

export const citiesPlugin = fp(citiesRoute, {
  fastify: '4.x',
  name: 'mastour-cities',
});
