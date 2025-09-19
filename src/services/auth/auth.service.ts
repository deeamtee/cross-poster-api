import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import type {
  AuthCredentials,
  AuthResponse,
  AuthSession,
  AuthTokens,
  DecodedAuthToken,
  UpdateProfilePayload
} from '../../types/auth';
import type { AuthProvider } from './auth.provider';

export class AuthService {
  private readonly encryptionKey: Buffer;
  constructor(
    private readonly provider: AuthProvider,
    private readonly jwtSecret: string,
    private readonly tokenTtlSeconds: number
  ) {
    if (!this.jwtSecret) {
      throw new Error('JWT secret is not configured');
    }
    this.encryptionKey = crypto.createHash('sha256').update(this.jwtSecret).digest();
  }

  private createTokens(session: AuthSession): AuthTokens {
    const firebasePayload = this.encodeFirebaseSession({
      idToken: session.idToken,
      refreshToken: session.refreshToken,
    });
    const token = jwt.sign(
      {
        user: session.user,
        firebase: {
          idToken: session.idToken,
          refreshToken: session.refreshToken,
        },
      },
      this.jwtSecret,
      {
        expiresIn: this.tokenTtlSeconds,
        subject: session.user.uid,
      }
    );

    return {
      token,
      expiresIn: this.tokenTtlSeconds,
    };
  }

  private encodeFirebaseSession(session: { idToken: string; refreshToken: string }): string {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', this.encryptionKey, iv);
    const serialized = JSON.stringify(session);
    const encrypted = Buffer.concat([cipher.update(serialized, 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag();
    return Buffer.concat([iv, authTag, encrypted]).toString('base64');
  }

  private decodeFirebaseSession(payload: string): { idToken: string; refreshToken: string } {
    const buffer = Buffer.from(payload, 'base64');
    const iv = buffer.subarray(0, 12);
    const authTag = buffer.subarray(12, 28);
    const encrypted = buffer.subarray(28);
    const decipher = crypto.createDecipheriv('aes-256-gcm', this.encryptionKey, iv);
    decipher.setAuthTag(authTag);
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    return JSON.parse(decrypted.toString('utf8')) as { idToken: string; refreshToken: string };
  }

  private buildAuthResponse(session: AuthSession): AuthResponse {
    return {
      user: session.user,
      tokens: this.createTokens(session),
    };
  }

  async signIn(credentials: AuthCredentials): Promise<AuthResponse> {
    const session = await this.provider.signIn(credentials);
    return this.buildAuthResponse(session);
  }

  async signUp(credentials: AuthCredentials): Promise<AuthResponse> {
    const session = await this.provider.signUp(credentials);
    return this.buildAuthResponse(session);
  }

  async refresh(refreshToken: string): Promise<AuthResponse> {
    const session = await this.provider.refreshSession(refreshToken);
    return this.buildAuthResponse(session);
  }

  async updateProfile(decodedToken: DecodedAuthToken, profile: UpdateProfilePayload): Promise<AuthResponse> {
    try {
      const updatedUser = await this.provider.updateProfile(decodedToken.firebase.idToken, profile);
      const session: AuthSession = {
        user: {
          ...decodedToken.user,
          displayName: updatedUser.displayName,
          photoURL: updatedUser.photoURL,
        },
        idToken: decodedToken.firebase.idToken,
        refreshToken: decodedToken.firebase.refreshToken,
      };

      return this.buildAuthResponse(session);
    } catch (error) {
      if (error instanceof Error && error.message.includes('TOKEN_EXPIRED')) {
        const refreshedSession = await this.provider.refreshSession(decodedToken.firebase.refreshToken);
        const updatedUser = await this.provider.updateProfile(refreshedSession.idToken, profile);
        const session: AuthSession = {
          user: {
            ...refreshedSession.user,
            displayName: updatedUser.displayName,
            photoURL: updatedUser.photoURL,
          },
          idToken: refreshedSession.idToken,
          refreshToken: refreshedSession.refreshToken,
        };

        return this.buildAuthResponse(session);
      }

      throw error;
    }
  }

  async sendPasswordReset(email: string): Promise<void> {
    await this.provider.sendPasswordReset(email);
  }

  verifyToken(token: string): DecodedAuthToken {
    const decoded = jwt.verify(token, this.jwtSecret) as DecodedAuthToken;
    return decoded;
  }
}
