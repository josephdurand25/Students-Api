export type ApiErrorValidationResponse = {
  success?: boolean;
  status_code?: number;
  message?: string;
  errors?: Record<string, string>;
}

export type ApiErrorResponse = {
  success?: boolean;
  message?: string;
  status_code: number;
  error?: string;
}
export type ApiError = ApiErrorValidationResponse | ApiErrorResponse

export type ApiResponseWithoutData<T> = {
  success: boolean;
  status_code?: number;
  message?: string;
};

export type ApiResponse<T> = {
  success: boolean;
  status_code: number;
  message?: string;
  data?: T;
};
export type ApiResponseOk<T> = {
  success: boolean;
  status_code: number;
  message?: string;
  data?: T | null;
};

export type TokenResponse = {
    access_token: string;
    token_type: string;
    expires_in: number;
    // user: User;
    permissions: string | string[];
}
