export interface User {
  id: number;
  email?: string;
  displayName?: string;
  steamId?: string;
  steamAvatar?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  displayName?: string;
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}

