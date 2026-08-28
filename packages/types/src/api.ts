/** Generic API response envelopes and pagination helpers. */

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface ApiError {
  success: false;
  message: string;
  errorCode?: string;
  details?: unknown;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

export function paginate<T>(items: T[], page = 1, limit = 20): Paginated<T> {
  const start = (page - 1) * limit;
  return {
    items: items.slice(start, start + limit),
    total: items.length,
    page,
    limit,
  };
}
