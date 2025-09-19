export interface AuthUser {
  uid: string;
  email: string;
  displayName?: string | null;
  photoURL?: string | null;
}

export interface AuthSession {
  user: AuthUser;
  idToken: string;
  refreshToken: string;
}

export interface AuthCredentials {
  email: string;
  password: string;
}

export interface AuthTokens {
  token: string;
  expiresIn: number;
}

export interface UpdateProfilePayload {
  displayName?: string;
  photoURL?: string;
}

export interface AuthResponse {
  user: AuthUser;
  tokens: AuthTokens;
}

export interface DecodedAuthToken {
  user: AuthUser;
  firebase: {
    idToken: string;
    refreshToken: string;
  };
  iat: number;
  exp: number;
}
declare global {
  namespace Express {
    interface Request {
      user?: DecodedAuthToken;
    }
  }
}

export {};
