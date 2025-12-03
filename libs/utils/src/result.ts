/**
 * Result type for explicit error handling per constitution (Principle III).
 * Railway-oriented programming pattern for composing operations.
 */

/**
 * Represents a successful operation result.
 */
export interface Success<T> {
  readonly success: true;
  readonly data: T;
}

/**
 * Represents a failed operation result.
 */
export interface Failure<E> {
  readonly success: false;
  readonly error: E;
}

/**
 * Discriminated union for operation results.
 * All functions that can fail return this type instead of throwing exceptions.
 */
export type Result<T, E> = Success<T> | Failure<E>;

/**
 * Creates a successful result.
 */
export const success = <T>(data: T): Success<T> => ({
  success: true,
  data,
});

/**
 * Creates a failed result.
 */
export const failure = <E>(error: E): Failure<E> => ({
  success: false,
  error,
});

/**
 * Type guard to check if a Result is successful.
 */
export const isSuccess = <T, E>(result: Result<T, E>): result is Success<T> =>
  result.success === true;

/**
 * Type guard to check if a Result is a failure.
 */
export const isFailure = <T, E>(result: Result<T, E>): result is Failure<E> =>
  result.success === false;

/**
 * Maps the success value of a Result.
 */
export const map = <T, U, E>(result: Result<T, E>, fn: (data: T) => U): Result<U, E> =>
  isSuccess(result) ? success(fn(result.data)) : result;

/**
 * Flat maps the success value of a Result (for chaining operations).
 */
export const flatMap = <T, U, E>(
  result: Result<T, E>,
  fn: (data: T) => Result<U, E>
): Result<U, E> => (isSuccess(result) ? fn(result.data) : result);

/**
 * Maps the error value of a Result.
 */
export const mapError = <T, E, F>(result: Result<T, E>, fn: (error: E) => F): Result<T, F> =>
  isFailure(result) ? failure(fn(result.error)) : result;

/**
 * Unwraps a Result, throwing if it's a failure.
 * Use only when you're certain the result is successful.
 */
export const unwrap = <T, E>(result: Result<T, E>): T => {
  if (isSuccess(result)) {
    return result.data;
  }
  throw new Error(`Attempted to unwrap a failure: ${JSON.stringify(result.error)}`);
};

/**
 * Unwraps a Result, returning a default value if it's a failure.
 */
export const unwrapOr = <T, E>(result: Result<T, E>, defaultValue: T): T =>
  isSuccess(result) ? result.data : defaultValue;

/**
 * Combines multiple Results into a single Result containing an array of values.
 * If any Result is a failure, returns the first failure.
 */
export const all = <T, E>(results: readonly Result<T, E>[]): Result<readonly T[], E> => {
  const values: T[] = [];
  for (const result of results) {
    if (isFailure(result)) {
      return result;
    }
    values.push(result.data);
  }
  return success(values);
};

/**
 * Async version of map.
 */
export const mapAsync = async <T, U, E>(
  result: Result<T, E>,
  fn: (data: T) => Promise<U>
): Promise<Result<U, E>> => (isSuccess(result) ? success(await fn(result.data)) : result);

/**
 * Async version of flatMap.
 */
export const flatMapAsync = async <T, U, E>(
  result: Result<T, E>,
  fn: (data: T) => Promise<Result<U, E>>
): Promise<Result<U, E>> => (isSuccess(result) ? fn(result.data) : result);
