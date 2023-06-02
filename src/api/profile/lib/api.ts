import { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import { Profile, ProfileSchema, addErrorSchemas } from '../../../schema';
import { sendResult, Err, toAppError } from '../../error-handling';
import * as data from './data';

const profileRoute: FastifyPluginAsync = async (fastify) => {
  fastify.get<{
    Reply: Profile['read']['response'];
  }>(
    `${ProfileSchema.path}`,
    {
      schema: {
        tags: ['profile', 'read'],
        response: addErrorSchemas({ 200: ProfileSchema.read.response }),
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, reply) => {
      if (request.user && request.user.id) {
        const result = await data.read(fastify.db, request.user.id);

        sendResult(result, reply, 200);
      } else {
        const result = Err(toAppError('Unathorized access'));
        sendResult(result, reply, 401);
      }
    }
  );

  fastify.put<{
    Body: Profile['update']['body'];
    Reply: Profile['update']['response'];
  }>(
    `${ProfileSchema.path}`,
    {
      schema: {
        tags: ['profile', 'update'],
        body: ProfileSchema.update.body,
        response: addErrorSchemas({ 200: ProfileSchema.update.response }),
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, reply) => {
      if (request.user && request.user.id) {
        const result = await data.update(
          fastify.db,
          request.user.id,
          request.body
        );

        sendResult(result, reply, 200);
      } else {
        const result = Err(toAppError('Unathorized access'));
        sendResult(result, reply, 401);
      }
    }
  );
};

export const profilePlugin = fp(profileRoute, {
  fastify: '4.x',
  name: 'mastour-profile',
});
