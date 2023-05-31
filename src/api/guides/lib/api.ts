import { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import { Guides, GuidesSchema, addErrorSchemas } from '../../../schema';
import { sendResult } from '../../error-handling';
import * as data from './data';

const guidesRoute: FastifyPluginAsync = async (
  fastify,
) => {

  fastify.get<{
    Reply: Guides['readMany']['response'];
  }>(
    `${GuidesSchema.path}${GuidesSchema.readMany.path}`,
    {
      schema: {
        tags: ['guides', 'readMany'],
        response: addErrorSchemas({ 200: GuidesSchema.readMany.response }),
        security: [{ bearerAuth: [] }]
      },
    },
    async (_request, reply) => {
      const result = await data.readMany(fastify.db);

      sendResult(result, reply, 200);
    }
  );
};

export const guidesPlugin = fp(guidesRoute, {
  fastify: '4.x',
  name: 'mastour-guides',
});
