export type ApiErrorResponse = {
  error: string;
  details?: unknown;
};

export type ApiSuccessResponse<T> = {
  data: T;
};

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;
