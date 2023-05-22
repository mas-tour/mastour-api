import { Result } from 'ts-results';

export { Err, Ok } from 'ts-results';

export type AppError<E> = {
  message: string;
  reason?: string;
  translate?: { ind: string; eng: string };
  data?: E;
};

export type AppResult<T> = Result<T, AppError<undefined>>;
export type AppResultWithData<T, D> = Result<T, AppError<D>>;

export function toAppError<T>(obj: T): AppError<undefined> {
  return {
    message: 'Oops! Something went wrong!',
    reason: `${obj}`,
  };
}
