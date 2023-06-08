import { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import {
  GuidesSchema,
  OrderedGuides,
  OrderedGuidesSchema,
  addErrorSchemas,
} from '../../../schema';
import { Err, sendResult, toAppError } from '../../error-handling';
import * as data from './data';

const orderedGuidesRoute: FastifyPluginAsync = async (fastify) => {
  fastify.post<{
    Params: OrderedGuides['book']['params'];
    Body: OrderedGuides['book']['body'];
    Reply: OrderedGuides['book']['response'];
  }>(
    `${OrderedGuidesSchema.path}${OrderedGuidesSchema.book.path}/:id`,
    {
      schema: {
        tags: ['ordered_guides', 'book'],
        params: OrderedGuidesSchema.book.params,
        body: OrderedGuidesSchema.book.body,
        response: addErrorSchemas({ 200: OrderedGuidesSchema.book.response }),
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, reply) => {
      if (request.user && request.user.id) {
        const result = await data.book(
          fastify.db,
          request.params,
          request.body,
          request.user.id
        );

        sendResult(result, reply, 201);
      } else {
        const result = Err(toAppError('Unathorized access'));
        sendResult(result, reply, 401);
      }
    }
  );
  fastify.get<{
    Querystring: OrderedGuides['readMany']['query'];  //something wrong?
    Reply: OrderedGuides['readMany']['response'];
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

export const orderedGuidesPlugin = fp(orderedGuidesRoute, {
  fastify: '4.x',
  name: 'mastour-ordered-guides',
});

