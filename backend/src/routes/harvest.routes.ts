import { Router } from 'express';
import { HarvestController } from '../controllers/harvest.controller.js';

const router = Router();

router.get('/', HarvestController.getHarvests);
router.post('/', HarvestController.createHarvest);
router.get('/:id', HarvestController.getHarvestById);
router.post('/:id/pre-order', HarvestController.preOrderHarvest);
router.patch('/:id/status', HarvestController.updateHarvestStatus);

export default router;
