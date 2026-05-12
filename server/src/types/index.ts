export interface QuestionsResponse {
  questions: string[];
}

export interface ApiErrorBody {
  error: {
    code: ApiErrorCode;
    message: string;
  };
}

export type ApiErrorCode =
  | 'VALIDATION_ERROR'
  | 'UPSTREAM_ERROR'
  | 'UPSTREAM_TIMEOUT'
  | 'UPSTREAM_RATE_LIMITED'
  | 'PARSE_ERROR'
  | 'INTERNAL_ERROR';
