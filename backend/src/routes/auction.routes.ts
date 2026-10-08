import { Router } from 'express';
import { AuctionController } from '../controllers/auction.controller.js';

const router = Router();

router.get('/', AuctionController.getAuctions);
router.post('/', AuctionController.createAuction);
router.get('/:id', AuctionController.getAuctionById);
router.post('/:id/bid', AuctionController.placeBid);
router.delete('/:id/bids/:bidIndexOrId', AuctionController.deleteBid);
router.delete('/:id/bid', AuctionController.deleteBid);
router.delete('/:id', AuctionController.deleteAuction);
router.post('/:id/finalize', AuctionController.finalizeWonAuction);

export default router;
