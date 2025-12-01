export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthenticationResponse {
  accessToken: string;
  refreshToken: string;
}

export interface User {
  id?: number;
  firstName?: string;
  lastName?: string;
  email: string;
  role?: string;
  createdAt?: Date;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  error: string | null;
  loading: boolean;
}