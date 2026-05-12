export interface QuestionsResponse {
  questions: string[];
}

export type ApiErrorCode =
  | 'VALIDATION_ERROR'
  | 'UPSTREAM_ERROR'
  | 'UPSTREAM_TIMEOUT'
  | 'UPSTREAM_RATE_LIMITED'
  | 'PARSE_ERROR'
  | 'INTERNAL_ERROR'
  | 'NETWORK_ERROR';

export interface ApiErrorPayload {
  code: ApiErrorCode;
  message: string;
}
