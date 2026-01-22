// ==========================================
// TYPES API - Version 2.0
// Types pour les réponses API standardisées
// ==========================================

// ==========================================
// RÉPONSES D'ERREUR
// ==========================================

// Erreur avec détails de validation (erreurs par champ)
export type ApiErrorValidationResponse = {
  success: false;
  status_code: number;
  message: string;
  errors: Record<string, string>;  // { field: errorMessage }
};

// Erreur simple
export type ApiErrorResponse = {
  success: false;
  status_code: number;
  message: string;
  error?: string;  // Stack trace ou détails techniques
};

// Union des types d'erreur
export type ApiError = ApiErrorValidationResponse | ApiErrorResponse;

// ==========================================
// RÉPONSES DE SUCCÈS
// ==========================================

// Réponse de succès sans données
export type ApiResponseWithoutData = {
  success: true;
  status_code: number;
  message?: string;
};

// Réponse de succès avec données
export type ApiResponseOk<T> = {
  success: true;
  status_code: number;
  message?: string;
  data: T;
};

// Réponse de succès avec données optionnelles
export type ApiResponseOptional<T> = {
  success: true;
  status_code: number;
  message?: string;
  data?: T | null;
};

// Union des réponses (succès ou erreur)
export type ApiResponse<T> = ApiResponseOk<T> | ApiError;

// ==========================================
// AUTHENTIFICATION
// ==========================================

export type TokenResponse = {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  user?: {
    id: number;
    email: string;
    nom: string;
    prenom: string;
    role: string;
  };
  permissions?: string | string[];
};

export type LoginRequest = {
  email: string;
  password: string;
  remember_me?: boolean;
};

export type RegisterRequest = {
  email: string;
  password: string;
  password_confirmation: string;
  nom: string;
  prenom: string;
  role?: string;
};

export type RefreshTokenRequest = {
  refresh_token: string;
};

// ==========================================
// PAGINATION
// ==========================================
// Interface pour pagination
export interface IPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface IPaginationResult<T> {
  data: T[];
  pagination: IPagination;
}

export type PaginationParams = {
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
};

export type PaginationMeta = {
  current_page: number;
  per_page: number;
  total: number;
  total_pages: number;
  from?: number;
  to?: number;
};

export type PaginatedResponse<T> = ApiResponseOk<{
  data: T[];
  pagination: PaginationMeta;
}>;

// ==========================================
// REQUÊTES COMMUNES
// ==========================================

export type SearchRequest = {
  query: string;
  filters?: Record<string, any>;
  page?: number;
  limit?: number;
};

export type BulkActionRequest<T = number> = {
  ids: T[];
  action: string;
  params?: Record<string, any>;
};

export type ExportRequest = {
  format: 'csv' | 'xlsx' | 'pdf';
  filters?: Record<string, any>;
  columns?: string[];
};

// ==========================================
// RÉPONSES COMMUNES
// ==========================================

export type BulkActionResponse = ApiResponseOk<{
  success_count: number;
  error_count: number;
  errors?: Array<{
    id: number | string;
    error: string;
  }>;
}>;

export type ExportResponse = ApiResponseOk<{
  file_url: string;
  file_name: string;
  expires_at: string;
}>;

export type UploadResponse = ApiResponseOk<{
  file_url: string;
  file_name: string;
  file_size: number;
  mime_type: string;
}>;

// ==========================================
// STATISTIQUES
// ==========================================

export type StatisticsResponse<T = any> = ApiResponseOk<{
  statistics: T;
  period: {
    start_date: string;
    end_date: string;
  };
  generated_at: string;
}>;

// ==========================================
// WEBSOCKET / TEMPS RÉEL
// ==========================================

export type WebSocketMessage<T = any> = {
  event: string;
  channel: string;
  data: T;
  timestamp: string;
};

export type NotificationMessage = {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  created_at: string;
  read: boolean;
};

// ==========================================
// HELPERS & GUARDS
// ==========================================

/**
 * Type guard pour vérifier si une réponse est un succès
 */
export function isApiSuccess<T>(response: ApiResponse<T>): response is ApiResponseOk<T> {
  return response.success === true;
}

/**
 * Type guard pour vérifier si une réponse est une erreur
 */
export function isApiError(response: any): response is ApiError {
  return response.success === false;
}

/**
 * Type guard pour vérifier si une erreur contient des erreurs de validation
 */
export function isValidationError(error: ApiError): error is ApiErrorValidationResponse {
  return 'errors' in error && typeof error.errors === 'object';
}

/**
 * Extrait le message d'erreur d'une réponse API
 */
export function getErrorMessage(error: ApiError): string {
  if (isValidationError(error)) {
    const firstError = Object.values(error.errors)[0];
    return firstError || error.message;
  }
  return error.message;
}

/**
 * Extrait toutes les erreurs de validation
 */
export function getValidationErrors(error: ApiError): Record<string, string> {
  if (isValidationError(error)) {
    return error.errors;
  }
  return {};
}

// ==========================================
// CODES DE STATUT HTTP
// ==========================================

export const HTTP_STATUS = {
  // Success
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,
  
  // Client Errors
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  
  // Server Errors
  INTERNAL_SERVER_ERROR: 500,
  NOT_IMPLEMENTED: 501,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
} as const;

export type HttpStatusCode = typeof HTTP_STATUS[keyof typeof HTTP_STATUS];

// ==========================================
// FACTORY FUNCTIONS
// ==========================================

/**
 * Crée une réponse de succès
 */
// export function createSuccessResponse<T>(
//   data: T,
//   message?: string,
//   status_code: number = HTTP_STATUS.OK
// ): ApiResponseOk<T> {
//   return {
//     success: true,
//     status_code,
//     message,
//     data
//   };
// }

// /**
//  * Crée une réponse d'erreur
//  */
// export function createErrorResponse(
//   message: string,
//   status_code: number = HTTP_STATUS.BAD_REQUEST,
//   error?: string
// ): ApiErrorResponse {
//   return {
//     success: false,
//     status_code,
//     message,
//     error
//   };
// }

/**
 * Crée une réponse d'erreur de validation
 */
export function createValidationErrorResponse(
  message: string,
  errors: Record<string, string>,
  status_code: number = HTTP_STATUS.UNPROCESSABLE_ENTITY
): ApiErrorValidationResponse {
  return {
    success: false,
    status_code,
    message,
    errors
  };
}

/**
 * Crée une réponse paginée
 */
// export function createPaginatedResponse<T>(
//   data: T[],
//   pagination: PaginationMeta,
//   message?: string
// ): PaginatedResponse<T> {
//   return createSuccessResponse({ data, pagination }, message);
// }