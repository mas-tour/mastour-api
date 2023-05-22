import { FastifyPluginAsync } from 'fastify';
import { BcryptOpts, JwtOptions, jwt } from '../../../plugins';
import fp from 'fastify-plugin';

import { Auth, AuthSchema, addErrorSchemas } from '../../../schema';
import { sendResult } from '../../error-handling';
import * as data from './data';

const authRoute: FastifyPluginAsync<JwtOptions & BcryptOpts> = async (
  fastify,
  opts
) => {
  fastify.register(jwt, opts);

  fastify.post<{
    Body: Auth['signup']['body'];
    Reply: Auth['signup']['response'];
  }>(
    `${AuthSchema.signup.path}`,
    {
      schema: {
        tags: ['auth', 'signup'],
        body: AuthSchema.signup.body,
        response: addErrorSchemas({ 200: AuthSchema.signup.response }),
      },
    },
    async (request, reply) => {
      const result = await data.signUp(
        fastify.db,
        request.body,
        opts.saltRounds
      );

      sendResult(result, reply, 201);
    }
  );
};

export const authPlugin = fp(authRoute, {
  fastify: '4.x',
  name: 'mastour-auth',
});
