import { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import { Categories, CategoriesSchema, addErrorSchemas } from '../../../schema';
import { sendResult } from '../../error-handling';
import * as data from './data';

const categoriesRoute: FastifyPluginAsync = async (fastify) => {
  fastify.get<{
    Reply: Categories['readMany']['response'];
  }>(
    `${CategoriesSchema.path}`,
    {
      schema: {
        tags: ['categories', 'readMany'],
        response: addErrorSchemas({ 200: CategoriesSchema.readMany.response }),
        security: [{ bearerAuth: [] }],
      },
    },
    async (_request, reply) => {
      const result = await data.readMany(fastify.db);

      sendResult(result, reply, 200);
    }
  );
};

export const categoriesPlugin = fp(categoriesRoute, {
  fastify: '4.x',
  name: 'mastour-categories',
});
