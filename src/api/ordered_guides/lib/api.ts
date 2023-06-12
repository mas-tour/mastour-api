import { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import {
  OrderedGuides,
  OrderedGuidesSchema,
  addErrorSchemas,
} from '../../../schema';
import { Err, sendResult, toAppError } from '../../error-handling';
import * as data from './data';
import { protect } from '../../../plugins';

const orderedGuidesRoute: FastifyPluginAsync = async (fastify) => {
  fastify.register(protect);

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
    Querystring: OrderedGuides['readMany']['query'];
    Reply: OrderedGuides['readMany']['response'];
  }>(
    `${OrderedGuidesSchema.path}${OrderedGuidesSchema.readMany.path}`,
    {
      schema: {
        tags: ['ordered_guides', 'readMany'],
        querystring: OrderedGuidesSchema.readMany.query,
        response: addErrorSchemas({
          200: OrderedGuidesSchema.readMany.response,
        }),
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, reply) => {
      if (request.user && request.user.id) {
        const result = await data.readMany(
          fastify.db,
          request.query,
          request.user.id
        );

        sendResult(result, reply, 200);
      } else {
        const result = Err(toAppError('Unathorized access'));
        sendResult(result, reply, 401);
      }
    }
  );
};

export const orderedGuidesPlugin = fp(orderedGuidesRoute, {
  fastify: '4.x',
  name: 'mastour-ordered-guides',
});
