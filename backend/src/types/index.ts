/**
 * Payload embedded inside a verified JWT.
 */
export interface AuthPayload {
  /** Primary key of the authenticated user. */
  userId: string;
  /** Email address of the authenticated user. */
  email: string;
}

/**
 * Common pagination query parameters.
 */
export interface PaginationQuery {
  /** 1-based page number. */
  page?: number;
  /** Maximum items per page. */
  limit?: number;
}

/**
 * Standard shape for every JSON response returned by the API.
 *
 * @typeParam T - Type of the `data` payload.
 */
export interface ApiResponse<T = unknown> {
  /** Whether the request completed successfully. */
  success: boolean;
  /** Response payload. */
  data: T;
  /** Human-readable message describing the result. */
  message: string;
  /** Optional structured error details (e.g. field-level validation errors). */
  errors?: Record<string, string[]>;
}
