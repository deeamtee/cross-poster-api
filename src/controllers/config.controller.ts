import type { Request, Response } from 'express';
import { configService } from '../services/config/config.service';

const unauthorized = { success: false, error: { code: 401, message: 'UNAUTHORIZED' } } as const;

class ConfigController {
  async getConfig(req: Request, res: Response) {
    const decoded = req.user;
    if (!decoded) {
      return res.status(401).json(unauthorized);
    }

    const config = await configService.getConfig(decoded.user.uid);
    if (!config) {
      return res.status(404).json({ success: false, error: { code: 404, message: 'CONFIG_NOT_FOUND' } });
    }

    return res.status(200).json({ success: true, data: config });
  }

  async saveConfig(req: Request, res: Response) {
    const decoded = req.user;
    if (!decoded) {
      return res.status(401).json(unauthorized);
    }

    const payload = req.body;
    if (!payload?.encryptedData || !payload?.iv || !payload?.salt) {
      return res.status(400).json({ success: false, error: { code: 400, message: 'INVALID_PAYLOAD' } });
    }

    await configService.saveConfig(decoded.user.uid, payload);
    return res.status(204).send();
  }

  async deleteConfig(req: Request, res: Response) {
    const decoded = req.user;
    if (!decoded) {
      return res.status(401).json(unauthorized);
    }

    await configService.deleteConfig(decoded.user.uid);
    return res.status(204).send();
  }

  async hasConfig(req: Request, res: Response) {
    const decoded = req.user;
    if (!decoded) {
      return res.status(401).json(unauthorized);
    }

    const exists = await configService.hasConfig(decoded.user.uid);
    return res.status(200).json({ success: true, data: { exists } });
  }
}

export const configController = new ConfigController();
