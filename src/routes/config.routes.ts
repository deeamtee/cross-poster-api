import { Router } from 'express';
import { configController } from '../controllers/config.controller';

const router = Router();

router.get('/', (req, res) => configController.getConfig(req, res));
router.get('/exists', (req, res) => configController.hasConfig(req, res));
router.post('/', (req, res) => configController.saveConfig(req, res));
router.delete('/', (req, res) => configController.deleteConfig(req, res));

export default router;
