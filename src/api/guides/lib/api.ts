import { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import { Guides, GuidesSchema, addErrorSchemas } from '../../../schema';
import { sendResult } from '../../error-handling';
import * as data from './data';
import { protect } from '../../../plugins';

const guidesRoute: FastifyPluginAsync = async (fastify) => {
  fastify.register(protect);

  fastify.get<{
    Querystring: Guides['readMany']['query'];
    Reply: Guides['readMany']['response'];
  }>(
    GuidesSchema.path,
    {
      schema: {
        tags: ['guides', 'readMany'],
        querystring: GuidesSchema.readMany.query,
        response: addErrorSchemas({ 200: GuidesSchema.readMany.response }),
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, reply) => {
      const result = await data.readMany(fastify.db, request.query);

      sendResult(result, reply, 200);
    }
  );

  fastify.get<{
    Params: Guides['read']['params'];
    Reply: Guides['read']['response'];
  }>(
    `${GuidesSchema.path}/:id`,
    {
      schema: {
        tags: ['guides', 'read'],
        params: GuidesSchema.read.params,
        response: addErrorSchemas({ 200: GuidesSchema.read.response }),
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, reply) => {
      const result = await data.read(fastify.db, request.params);

      sendResult(result, reply, 200);
    }
  );
};

export const guidesPlugin = fp(guidesRoute, {
  fastify: '4.x',
  name: 'mastour-guides',
});
