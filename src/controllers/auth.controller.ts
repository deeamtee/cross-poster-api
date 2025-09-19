import type { Request, Response } from 'express';
import { authService } from '../services/auth';
import type { AuthCredentials, UpdateProfilePayload } from '../services/auth';

const toErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  return 'UNKNOWN_ERROR';
};

class AuthController {
  async signIn(req: Request, res: Response) {
    try {
      const credentials = req.body as AuthCredentials;
      if (!credentials?.email || !credentials?.password) {
        return res.status(400).json({ success: false, error: { code: 400, message: 'EMAIL_AND_PASSWORD_REQUIRED' } });
      }

      const result = await authService.signIn(credentials);
      return res.status(200).json({ success: true, data: result });
    } catch (error) {
      return res.status(401).json({ success: false, error: { code: 401, message: toErrorMessage(error) } });
    }
  }

  async signUp(req: Request, res: Response) {
    try {
      const credentials = req.body as AuthCredentials;
      if (!credentials?.email || !credentials?.password) {
        return res.status(400).json({ success: false, error: { code: 400, message: 'EMAIL_AND_PASSWORD_REQUIRED' } });
      }

      const result = await authService.signUp(credentials);
      return res.status(201).json({ success: true, data: result });
    } catch (error) {
      return res.status(400).json({ success: false, error: { code: 400, message: toErrorMessage(error) } });
    }
  }

  async refresh(req: Request, res: Response) {
    try {
      const { refreshToken } = req.body as { refreshToken?: string };
      if (!refreshToken) {
        return res.status(400).json({ success: false, error: { code: 400, message: 'REFRESH_TOKEN_REQUIRED' } });
      }

      const result = await authService.refresh(refreshToken);
      return res.status(200).json({ success: true, data: result });
    } catch (error) {
      return res.status(401).json({ success: false, error: { code: 401, message: toErrorMessage(error) } });
    }
  }

  async me(req: Request, res: Response) {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, error: { code: 401, message: 'UNAUTHORIZED' } });
    }

    return res.status(200).json({
      success: true,
      data: {
        user: user.user,
      },
    });
  }

  async signOut(_req: Request, res: Response) {
    return res.status(200).json({ success: true });
  }

  async resetPassword(req: Request, res: Response) {
    try {
      const { email } = req.body as { email?: string };
      if (!email) {
        return res.status(400).json({ success: false, error: { code: 400, message: 'EMAIL_REQUIRED' } });
      }

      await authService.sendPasswordReset(email);
      return res.status(200).json({ success: true });
    } catch (error) {
      return res.status(400).json({ success: false, error: { code: 400, message: toErrorMessage(error) } });
    }
  }

  async updateProfile(req: Request, res: Response) {
    try {
      const decoded = req.user;
      if (!decoded) {
        return res.status(401).json({ success: false, error: { code: 401, message: 'UNAUTHORIZED' } });
      }

      const profile = req.body as UpdateProfilePayload;
      const result = await authService.updateProfile(decoded, profile);
      return res.status(200).json({ success: true, data: result });
    } catch (error) {
      return res.status(400).json({ success: false, error: { code: 400, message: toErrorMessage(error) } });
    }
  }
}

export const authController = new AuthController();
