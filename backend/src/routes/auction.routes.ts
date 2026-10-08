import { Router } from 'express';
import { AuctionController } from '../controllers/auction.controller.js';

const router = Router();

router.get('/', AuctionController.getAuctions);
router.post('/', AuctionController.createAuction);
router.get('/:id', AuctionController.getAuctionById);
router.post('/:id/bid', AuctionController.placeBid);
router.post('/:id/finalize', AuctionController.finalizeWonAuction);

export default router;
