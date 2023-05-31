import { FastifyReply } from 'fastify';
import { StatusCodes } from 'http-status-codes';

import { AppError, AppResultWithData } from './results';

export function sendResult<T, E>(
  result: AppResultWithData<T, E>,
  reply: FastifyReply,
  okStatusCode = 200
): void {
  if (result.ok) {
    reply.code(okStatusCode).send(result.val);
  } else {
    reply.code(parseStatusCode(result.val)).send(result.val);
  }
}

function parseStatusCode<E>(error: AppError<E>): number {
  const reason = (error.reason ?? '').toLowerCase();
  const badRequestKeywords = [
    'invalid date',
    'invalid time',
    'invalid input syntax for type',
    'violates foreign key constraint',
    'violates check constraint',
    'received unexpected keys',
    'parse error',
    'date/time field value out of range',
    'error: syntax error at or near',
    'is too large',
    'is wrong',
    'pelanggaran batasan',
    'tidak sesuai',
    'telah berakhir',
    'belum dimulai'
  ];
  if (badRequestKeywords.some((kw) => reason.includes(kw))) {
    return StatusCodes.BAD_REQUEST;
  }
  if (reason.includes('column') && reason.includes('does not exist')) {
    return StatusCodes.BAD_REQUEST;
  }
  const forbiddenKeywords = ['tidak memiliki akses'];
  if (forbiddenKeywords.some((kw) => reason.includes(kw))) {
    return StatusCodes.FORBIDDEN;
  }
  const conflictKeywords = [
    'duplicate key value violates unique constraint',
    'telah terdaftar',
  ];
  if (conflictKeywords.some((kw) => reason.includes(kw))) {
    return StatusCodes.CONFLICT;
  }
  const notFoundKeywords = ['no result', 'tidak terdaftar', 'tidak ditemukan'];
  if (notFoundKeywords.some((kw) => reason.includes(kw))) {
    return StatusCodes.NOT_FOUND;
  }
  if (error.message === 'Gagal masuk!') {
    return StatusCodes.UNAUTHORIZED;
  }
  return StatusCodes.INTERNAL_SERVER_ERROR;
}
