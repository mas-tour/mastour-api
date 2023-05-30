import { AppError } from '../../api/error-handling';
import jwtPlugin, { FastifyJWTOptions } from '@fastify/jwt';
import { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import { ReasonPhrases, StatusCodes } from 'http-status-codes';

export { JWT } from '@fastify/jwt';

export type Payload = {
  id: string;
  username: string;
  email: string;
};
export type User = {
  id: string | undefined;
  username: string | undefined;
  email: string | undefined;
};

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: Payload;
    user: User;
  }
}

export type JwtOptions = FastifyJWTOptions & { prefix: string };
export const jwt: FastifyPluginAsync<JwtOptions> = fp<JwtOptions>(
  async (fastify, opts) => {
    fastify.register(jwtPlugin, opts).addHook('onRequest', async (request) => {
      try {
        console.debug('masooeeekkkk');
        await request.jwtVerify();
      } catch (err) {
        console.debug({ err });
        request.user = { id: undefined, username: undefined, email: undefined };
      }
    });
  }
);

export const protect: FastifyPluginAsync = fp(async (fastify, _opts) => {
  fastify.addHook('onRequest', (request, reply, done) => {
    const isJwtVerified =
      request.user.id !== undefined &&
      request.user.email !== undefined &&
      request.user.username !== undefined;
    if (!isJwtVerified) {
      const appError: AppError<undefined> = {
        message: 'Failed to verify your authentication token!',
        reason: ReasonPhrases.UNAUTHORIZED,
      };
      reply.code(StatusCodes.UNAUTHORIZED).send(appError);
      done();
    }

    done();
  });
});
