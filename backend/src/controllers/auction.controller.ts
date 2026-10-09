import { Request, Response } from 'express';
import { AuctionModel } from '../models/Auction.js';
import { NotificationController } from './notification.controller.js';
import { sendSuccess, sendError } from '../utils/response.js';

export class AuctionController {
  /**
   * Get all auctions (with filter tabs: live, upcoming, won, my-bids, farmerId)
   */
  static async getAuctions(req: Request, res: Response) {
    try {
      const { tab = 'live', userId, farmerId } = req.query;
      let query: any = {};

      if (farmerId) {
        query.farmerId = farmerId;
      } else if (tab === 'live') {
        query.status = 'live';
      } else if (tab === 'upcoming') {
        query.status = 'upcoming';
      } else if (tab === 'won' && userId) {
        query.winnerId = userId;
      } else if (tab === 'my-bids' && userId) {
        query['bids.bidderId'] = userId;
      }

      let auctions: any = await AuctionModel.find(query).sort({ endTime: 1 });

      // Auto-seed default live auctions if empty!
      if (auctions.length === 0 && !farmerId) {
        auctions = await AuctionController.seedDefaultAuctions();
      }

      return sendSuccess(res, auctions, 'Auctions loaded successfully.');
    } catch (err: any) {
      console.error('[AuctionController] getAuctions error:', err);
      return sendError(res, err.message || 'Could not load auctions.', 500);
    }
  }

  /**
   * Get single auction details
   */
  static async getAuctionById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const auction = await AuctionModel.findById(id);

      if (!auction) {
        return sendError(res, 'Auction not found.', 404);
      }

      // Check if expired and update status
      const now = new Date();
      if (new Date(auction.endTime) <= now && auction.status === 'live') {
        auction.status = 'ended';
        if (auction.highestBidderId && auction.currentBidPerKg >= auction.reservePricePerKg) {
          auction.winnerId = auction.highestBidderId;
          auction.winnerName = auction.highestBidderName;
          auction.finalPricePerKg = auction.currentBidPerKg;
          auction.winningTotalAmount = auction.currentBidPerKg * auction.lotSizeKg;
        }
        await auction.save();
      }

      return sendSuccess(res, auction, 'Auction details loaded.');
    } catch (err: any) {
      console.error('[AuctionController] getAuctionById error:', err);
      return sendError(res, err.message || 'Could not load auction.', 500);
    }
  }

  /**
   * Farmer creates/lists a lot for live bidding
   */
  static async createAuction(req: Request, res: Response) {
    try {
      const {
        farmerId,
        farmerName,
        farmerAvatar,
        farmerFarm,
        cropName,
        variety = 'Grade A',
        grade = 'Grade A',
        lotSizeKg,
        unit = 'kg',
        image,
        startingPricePerKg,
        reservePricePerKg,
        minBidIncrement = 5,
        durationHours = 24,
        locationDistrict = 'Nuwara Eliya',
        description = '',
      } = req.body;

      if (!farmerId || !cropName || !lotSizeKg || !startingPricePerKg) {
        return sendError(res, 'Crop name, lot size, and starting price are required.', 400);
      }

      const now = new Date();
      const endTime = new Date(now.getTime() + Number(durationHours) * 60 * 60 * 1000).toISOString();

      const auction = await AuctionModel.create({
        farmerId,
        farmerName: farmerName || 'Farmer',
        farmerAvatar: farmerAvatar || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400',
        farmerFarm: farmerFarm || 'Govigedara Farm',
        cropName,
        variety,
        grade,
        lotSizeKg: Number(lotSizeKg),
        unit,
        image: image || 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=400',
        startingPricePerKg: Number(startingPricePerKg),
        reservePricePerKg: Number(reservePricePerKg || startingPricePerKg),
        minBidIncrement: Number(minBidIncrement),
        currentBidPerKg: Number(startingPricePerKg),
        highestBidderId: '',
        highestBidderName: '',
        bidsCount: 0,
        bids: [],
        startTime: now.toISOString(),
        endTime,
        status: 'live',
        locationDistrict,
        description,
      });

      return sendSuccess(res, auction, 'Auction created and live!');
    } catch (err: any) {
      console.error('[AuctionController] createAuction error:', err);
      return sendError(res, err.message || 'Could not create auction.', 500);
    }
  }

  /**
   * Place a live bid on an active auction
   */
  static async placeBid(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { bidderId, bidderName, bidAmountPerKg } = req.body;

      if (!bidderId || !bidAmountPerKg) {
        return sendError(res, 'bidderId and bidAmountPerKg are required.', 400);
      }

      const auction = await AuctionModel.findById(id);
      if (!auction) {
        return sendError(res, 'Auction not found.', 404);
      }

      if (auction.status !== 'live') {
        return sendError(res, 'This auction is no longer active for bidding.', 400);
      }

      const now = new Date();
      if (new Date(auction.endTime) <= now) {
        auction.status = 'ended';
        await auction.save();
        return sendError(res, 'Auction time has expired.', 400);
      }

      const minAllowed = auction.currentBidPerKg + auction.minBidIncrement;
      const bid = Number(bidAmountPerKg);

      if (bid < minAllowed) {
        return sendError(
          res,
          `Minimum acceptable bid is Rs. ${minAllowed}/kg (Increment: +Rs. ${auction.minBidIncrement}).`,
          400
        );
      }

      const totalLotAmount = bid * auction.lotSizeKg;

      const newBid = {
        bidderId,
        bidderName: bidderName || 'Verified Buyer',
        bidAmountPerKg: bid,
        totalLotAmount,
        timestamp: new Date().toISOString(),
      };

      auction.currentBidPerKg = bid;
      auction.highestBidderId = bidderId;
      auction.highestBidderName = bidderName || 'Verified Buyer';
      auction.bidsCount += 1;
      auction.bids.unshift(newBid);

      // Auto-extend auction by 2 minutes if bid placed in the final 2 minutes ("anti-sniping")
      const timeRemainingMs = new Date(auction.endTime).getTime() - now.getTime();
      if (timeRemainingMs < 2 * 60 * 1000) {
        auction.endTime = new Date(now.getTime() + 3 * 60 * 1000).toISOString();
      }

      await auction.save();

      // ── Notification: Notify all buyers + auction farmer ───────────────────
      // 1. Notify the farmer who listed the auction
      if (auction.farmerId) {
        NotificationController.createNotification({
          userId: auction.farmerId,
          title: `📈 New Bid on your auction: ${auction.cropName}`,
          description: `${bidderName || 'A buyer'} placed a bid of Rs. ${bid}/kg on your ${auction.lotSizeKg} ${auction.unit} lot (Total: Rs. ${totalLotAmount.toLocaleString()}).`,
          type: 'bid',
          data: { auctionId: auction._id.toString(), bidAmount: bid, cropName: auction.cropName },
          actionLabel: 'View Auction',
          actionRoute: 'auction',
        }).catch(() => {});
      }

      // 2. Notify all registered buyers about the new leading bid
      NotificationController.notifyAllBuyers({
        title: `🔨 New Bid: Rs. ${bid}/kg on ${auction.cropName}`,
        description: `${bidderName || 'A buyer'} placed a new leading bid on ${auction.cropName} (${auction.variety || 'Lot'}). Current: Rs. ${bid}/kg. Place your counter-bid now!`,
        excludeUserId: bidderId,
        data: { auctionId: auction._id.toString(), bidAmount: bid, cropName: auction.cropName },
        actionLabel: 'Bid Now',
        actionRoute: 'auction',
      }).catch(() => {});

      return sendSuccess(
        res,
        {
          auction,
          placedBid: newBid,
          isHighest: true,
        },
        'Bid placed successfully!'
      );
    } catch (err: any) {
      console.error('[AuctionController] placeBid error:', err);
      return sendError(res, err.message || 'Could not place bid.', 500);
    }
  }

  /**
   * Finalize auction and record winning payment
   */
  static async finalizeWonAuction(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { stripePaymentIntentId, orderId } = req.body;

      const auction = await AuctionModel.findById(id);
      if (!auction) {
        return sendError(res, 'Auction not found.', 404);
      }

      auction.status = 'paid';
      if (stripePaymentIntentId) auction.stripePaymentIntentId = stripePaymentIntentId;
      if (orderId) auction.orderId = orderId;
      await auction.save();

      return sendSuccess(res, auction, 'Winning auction payment finalized.');
    } catch (err: any) {
      console.error('[AuctionController] finalizeWonAuction error:', err);
      return sendError(res, err.message || 'Could not finalize auction.', 500);
    }
  }

  /**
   * Seed realistic live produce auctions
   */
  static async seedDefaultAuctions() {
    const now = new Date();
    const addHours = (h: number) => new Date(now.getTime() + h * 60 * 60 * 1000).toISOString();

    const seeds = [
      {
        farmerId: 'farmer-kusuma',
        farmerName: 'Kusuma Bandara',
        farmerAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400',
        farmerFarm: 'Govigedara Highland Farm, Welimada',
        cropName: 'Padma Premium Red Tomatoes (Grade A)',
        variety: 'Padma Elite',
        grade: 'Grade A',
        lotSizeKg: 500,
        unit: 'kg',
        image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=400',
        startingPricePerKg: 190,
        reservePricePerKg: 220,
        minBidIncrement: 5,
        currentBidPerKg: 225,
        highestBidderId: 'buyer-sunil',
        highestBidderName: 'Sunil Dissanayake',
        bidsCount: 7,
        bids: [
          {
            bidderId: 'buyer-sunil',
            bidderName: 'Sunil Dissanayake',
            bidAmountPerKg: 225,
            totalLotAmount: 112500,
            timestamp: new Date(now.getTime() - 12 * 60 * 1000).toISOString(),
          },
          {
            bidderId: 'buyer-greenleaf',
            bidderName: 'Green Leaf Supermarket',
            bidAmountPerKg: 220,
            totalLotAmount: 110000,
            timestamp: new Date(now.getTime() - 35 * 60 * 1000).toISOString(),
          },
          {
            bidderId: 'buyer-rathna',
            bidderName: 'Rathna Stores Pettah',
            bidAmountPerKg: 210,
            totalLotAmount: 105000,
            timestamp: new Date(now.getTime() - 65 * 60 * 1000).toISOString(),
          },
        ],
        startTime: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
        endTime: addHours(3.5),
        status: 'live',
        locationDistrict: 'Badulla',
        description: '500kg lot of uniform firm tomatoes sorted in wooden crates. Ready for cold transit dispatch.',
      },
      {
        farmerId: 'farmer-anura',
        farmerName: 'Anura Senanayake',
        farmerAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400',
        farmerFarm: 'Matale Spice Haven, Rattota',
        cropName: 'Ceylon Alba Grade True Cinnamon Quills',
        variety: 'Alba Super Thin',
        grade: 'Alba (Highest Export Grade)',
        lotSizeKg: 120,
        unit: 'kg',
        image: 'https://images.unsplash.com/photo-1509358271058-acd22cc93898?w=400',
        startingPricePerKg: 3600,
        reservePricePerKg: 4000,
        minBidIncrement: 50,
        currentBidPerKg: 4200,
        highestBidderId: 'buyer-ceylon-spice',
        highestBidderName: 'Lanka Export Consortium',
        bidsCount: 14,
        bids: [
          {
            bidderId: 'buyer-ceylon-spice',
            bidderName: 'Lanka Export Consortium',
            bidAmountPerKg: 4200,
            totalLotAmount: 504000,
            timestamp: new Date(now.getTime() - 22 * 60 * 1000).toISOString(),
          },
          {
            bidderId: 'buyer-spice-king',
            bidderName: 'Spice King Global',
            bidAmountPerKg: 4150,
            totalLotAmount: 498000,
            timestamp: new Date(now.getTime() - 48 * 60 * 1000).toISOString(),
          },
        ],
        startTime: new Date(now.getTime() - 5 * 60 * 60 * 1000).toISOString(),
        endTime: addHours(6.2),
        status: 'live',
        locationDistrict: 'Matale',
        description: 'Certified 100% pure Ceylon Alba cinnamon quills with pencil-thin rolls and maximum eugenol oil content.',
      },
      {
        farmerId: 'farmer-sunil-bandara',
        farmerName: 'Sunil Bandara',
        farmerAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
        farmerFarm: 'Kandurata Green Plots',
        cropName: 'Highland Button Mushrooms (Fresh Pick)',
        variety: 'Agaricus Bisporus',
        grade: 'Grade A',
        lotSizeKg: 150,
        unit: 'kg',
        image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400',
        startingPricePerKg: 650,
        reservePricePerKg: 750,
        minBidIncrement: 10,
        currentBidPerKg: 780,
        highestBidderId: 'buyer-hotel-galle',
        highestBidderName: 'Galle Face Hotel Procurement',
        bidsCount: 9,
        bids: [
          {
            bidderId: 'buyer-hotel-galle',
            bidderName: 'Galle Face Hotel Procurement',
            bidAmountPerKg: 780,
            totalLotAmount: 117000,
            timestamp: new Date(now.getTime() - 8 * 60 * 1000).toISOString(),
          },
        ],
        startTime: new Date(now.getTime() - 1 * 60 * 60 * 1000).toISOString(),
        endTime: addHours(1.8),
        status: 'live',
        locationDistrict: 'Nuwara Eliya',
        description: 'Hand-picked button mushrooms harvested in climate-controlled dark rooms. Pristine white tops.',
      },
    ];

    return await AuctionModel.insertMany(seeds);
  }
}
