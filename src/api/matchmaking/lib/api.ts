import { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import {
  Matchmaking,
  MatchmakingSchema,
  addErrorSchemas,
} from '../../../schema';
import { sendResult } from '../../error-handling';
import * as data from './data';

const matchmakingRoute: FastifyPluginAsync = async (fastify) => {
  fastify.post<{
    Body: Matchmaking['survey']['body'];
    Reply: Matchmaking['survey']['response'];
  }>(
    `${MatchmakingSchema.path}${MatchmakingSchema.survey.path}`,
    {
      schema: {
        tags: ['matchmaking', 'survey'],
        body: MatchmakingSchema.survey.body,
        response: addErrorSchemas({ 200: MatchmakingSchema.survey.response }),
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, reply) => {
      const result = await data.survey(
        fastify.db,
        request.body,
        request.user.id ?? ''
      );

      sendResult(result, reply, 200);
    }
  );

  fastify.post<{
    Body: Matchmaking['search']['body'];
    Reply: Matchmaking['search']['response'];
  }>(
    `${MatchmakingSchema.path}${MatchmakingSchema.search.path}`,
    {
      schema: {
        tags: ['matchmaking', 'search'],
        body: MatchmakingSchema.search.body,
        response: addErrorSchemas({ 200: MatchmakingSchema.search.response }),
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, reply) => {
      const result = await data.search(
        fastify.db,
        request.body,
        request.user.id ?? ''
      );

      sendResult(result, reply, 200);
    }
  );
};

export const matchmakingPlugin = fp(matchmakingRoute, {
  fastify: '4.x',
  name: 'mastour-matchmaking',
});
