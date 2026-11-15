export type ApiErrorKind = 'network' | 'unauthorized' | 'forbidden' | 'validation' | 'server' | 'timeout';
export class ApiError extends Error {
  constructor(readonly status: number, readonly kind: ApiErrorKind, message: string, readonly correlationId?: string) { super(message); }
}
