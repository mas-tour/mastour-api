import { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import { Guides, GuidesSchema, addErrorSchemas } from '../../../schema';
import { sendResult } from '../../error-handling';
import * as data from './data';

const guidesRoute: FastifyPluginAsync = async (fastify) => {
  fastify.get<{
    Querystring: Guides['readMany']['query'];
    Reply: Guides['readMany']['response'];
  }>(
    GuidesSchema.path,
    {
      schema: {
        tags: ['guides', 'readMany'],
        // TODO(Ravi): If not commented it returns an error that it is required
        // even though it exists
        //querystring: GuidesSchema.readMany.query,
        response: addErrorSchemas({ 200: GuidesSchema.readMany.response }),
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, reply) => {
      const result = await data.readMany(fastify.db, request.query);

      sendResult(result, reply, 200);
    }
  );
};

export const guidesPlugin = fp(guidesRoute, {
  fastify: '4.x',
  name: 'mastour-guides',
});
