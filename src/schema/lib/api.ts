import { Type } from '@sinclair/typebox';

import { DbSchema } from '../../database';

// ---------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------
const ErrorSchema = Type.Object({
  message: Type.String(),
  reason: Type.Optional(Type.String()),
  translate: Type.Optional(
    Type.Object({
      eng: Type.String(),
      ind: Type.String(),
    })
  ),
  data: Type.Optional(Type.Any()),
});

export function addErrorSchemas(responseSchema: object): object {
  return {
    ...responseSchema,
    400: ErrorSchema,
    500: ErrorSchema,
  };
}

// ---------------------------------------------------------------------------
// Masked Password for User
// ---------------------------------------------------------------------------
export const MaskedPasswordSchema = Type.Object({
  password: Type.Literal('xxx'),
});
export const MaskedUserSchema = Type.Intersect([
  Type.Omit(DbSchema['users'], ['password']),
  MaskedPasswordSchema,
]);
