import type { ApiErrorBody, SnapshotDto } from '@stock-trading/shared';

export class ApiError extends Error {
  constructor(readonly code: string, message: string, readonly status: number) {
    super(message);
  }
}

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(path, {
    ...init,
    credentials: 'same-origin',
    headers: { 'content-type': 'application/json', ...init.headers }
  });
  if (response.status === 204) return undefined as T;
  const body = await response.json() as T | ApiErrorBody;
  if (!response.ok) {
    const error = (body as ApiErrorBody).error;
    throw new ApiError(error?.code ?? 'UNKNOWN_ERROR', error?.message ?? '请求失败', response.status);
  }
  return body as T;
}

export const fetchSnapshot = () => apiRequest<SnapshotDto>('/api/snapshot');
