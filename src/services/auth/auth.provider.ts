import type { AuthCredentials, AuthSession, UpdateProfilePayload, AuthUser } from '../../types/auth';

export interface AuthProvider {
  signIn(credentials: AuthCredentials): Promise<AuthSession>;
  signUp(credentials: AuthCredentials): Promise<AuthSession>;
  sendPasswordReset(email: string): Promise<void>;
  updateProfile(idToken: string, profile: UpdateProfilePayload): Promise<AuthUser>;
  refreshSession(refreshToken: string): Promise<AuthSession>;
}
