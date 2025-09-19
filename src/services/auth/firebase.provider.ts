import axios, { AxiosError } from 'axios';
import type {
  AuthCredentials,
  AuthSession,
  AuthUser,
  UpdateProfilePayload
} from '../../types/auth';
import type { AuthProvider } from './auth.provider';

interface FirebaseAuthResponse {
  localId: string;
  email: string;
  displayName?: string;
  photoUrl?: string;
  idToken: string;
  refreshToken: string;
  expiresIn?: string;
}

interface FirebaseLookupResponse {
  users: Array<{
    localId: string;
    email: string;
    displayName?: string;
    photoUrl?: string;
  }>;
}

interface FirebaseErrorResponse {
  error?: {
    message?: string;
  };
}

const FIREBASE_IDENTITY_BASE_URL = 'https://identitytoolkit.googleapis.com/v1';
const FIREBASE_SECURE_TOKEN_URL = 'https://securetoken.googleapis.com/v1/token';

const mapUser = (payload: FirebaseAuthResponse | FirebaseLookupResponse['users'][number]): AuthUser => ({
  uid: payload.localId,
  email: payload.email,
  displayName: payload.displayName ?? null,
  photoURL: payload.photoUrl ?? null,
});

const mapSession = (payload: FirebaseAuthResponse): AuthSession => ({
  user: mapUser(payload),
  idToken: payload.idToken,
  refreshToken: payload.refreshToken,
});

const extractFirebaseError = (error: AxiosError<FirebaseErrorResponse>): string => {
  if (error.response?.data?.error?.message) {
    return error.response.data.error.message;
  }

  if (error.message) {
    return error.message;
  }

  return 'UNEXPECTED_ERROR';
};

export class FirebaseAuthProvider implements AuthProvider {
  constructor(private readonly apiKey: string) {
    if (!this.apiKey) {
      throw new Error('Firebase API key is not configured');
    }
  }

  private getEndpoint(path: string): string {
    return `${FIREBASE_IDENTITY_BASE_URL}/${path}?key=${this.apiKey}`;
  }

  private async lookupUser(idToken: string): Promise<AuthUser> {
    const { data } = await axios.post<FirebaseLookupResponse>(
      this.getEndpoint('accounts:lookup'),
      { idToken }
    );

    const userRecord = data.users?.[0];
    if (!userRecord) {
      throw new Error('FIREBASE_LOOKUP_FAILED:USER_NOT_FOUND');
    }

    return mapUser(userRecord);
  }

  async signIn(credentials: AuthCredentials): Promise<AuthSession> {
    try {
      const { data } = await axios.post<FirebaseAuthResponse>(
        this.getEndpoint('accounts:signInWithPassword'),
        {
          email: credentials.email,
          password: credentials.password,
          returnSecureToken: true,
        }
      );

      return mapSession(data);
    } catch (error) {
      const firebaseError = error as AxiosError<FirebaseErrorResponse>;
      throw new Error(`FIREBASE_SIGN_IN_FAILED:${extractFirebaseError(firebaseError)}`);
    }
  }

  async signUp(credentials: AuthCredentials): Promise<AuthSession> {
    try {
      const { data } = await axios.post<FirebaseAuthResponse>(
        this.getEndpoint('accounts:signUp'),
        {
          email: credentials.email,
          password: credentials.password,
          returnSecureToken: true,
        }
      );

      return mapSession(data);
    } catch (error) {
      const firebaseError = error as AxiosError<FirebaseErrorResponse>;
      throw new Error(`FIREBASE_SIGN_UP_FAILED:${extractFirebaseError(firebaseError)}`);
    }
  }

  async sendPasswordReset(email: string): Promise<void> {
    try {
      await axios.post(
        this.getEndpoint('accounts:sendOobCode'),
        {
          requestType: 'PASSWORD_RESET',
          email,
        }
      );
    } catch (error) {
      const firebaseError = error as AxiosError<FirebaseErrorResponse>;
      throw new Error(`FIREBASE_RESET_PASSWORD_FAILED:${extractFirebaseError(firebaseError)}`);
    }
  }

  async updateProfile(idToken: string, profile: UpdateProfilePayload): Promise<AuthUser> {
    try {
      const { data } = await axios.post<FirebaseAuthResponse>(
        this.getEndpoint('accounts:update'),
        {
          idToken,
          displayName: profile.displayName,
          photoUrl: profile.photoURL,
          returnSecureToken: false,
        }
      );

      return mapUser(data);
    } catch (error) {
      const firebaseError = error as AxiosError<FirebaseErrorResponse>;
      throw new Error(`FIREBASE_UPDATE_PROFILE_FAILED:${extractFirebaseError(firebaseError)}`);
    }
  }

  async refreshSession(refreshToken: string): Promise<AuthSession> {
    try {
      const { data } = await axios.post(
        `${FIREBASE_SECURE_TOKEN_URL}?key=${this.apiKey}`,
        {
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
        }
      );

      const idToken = data.id_token as string;
      const newRefreshToken = data.refresh_token as string;
      const user = await this.lookupUser(idToken);

      return {
        user,
        idToken,
        refreshToken: newRefreshToken,
      };
    } catch (error) {
      const firebaseError = error as AxiosError<FirebaseErrorResponse>;
      throw new Error(`FIREBASE_REFRESH_FAILED:${extractFirebaseError(firebaseError)}`);
    }
  }
}
