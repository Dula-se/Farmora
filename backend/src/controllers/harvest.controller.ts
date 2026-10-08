import { Request, Response } from 'express';
import { HarvestModel } from '../models/Harvest.js';
import { sendSuccess, sendError } from '../utils/response.js';

export class HarvestController {
  /**
   * Get all scheduled harvest batches (with optional filters: month, district, category, farmerId)
   */
  static async getHarvests(req: Request, res: Response) {
    try {
      const { month, district, category, farmerId } = req.query;
      let query: any = {};

      if (farmerId) {
        query.farmerId = farmerId;
      }
      if (district && district !== 'All Island' && district !== 'All') {
        query.locationDistrict = district;
      }
      if (category && category !== 'All') {
        query.category = category;
      }
      if (month && typeof month === 'string') {
        // Match expectedHarvestDate starting with YYYY-MM
        query.expectedHarvestDate = { $regex: `^${month}` };
      }

      let harvests: any = await HarvestModel.find(query).sort({ expectedHarvestDate: 1 });

      // If empty, auto-seed with rich realistic Sri Lankan harvest batches!
      if (harvests.length === 0 && !farmerId) {
        harvests = await HarvestController.seedDefaultHarvests();
      }

      return sendSuccess(res, harvests, 'Scheduled harvests loaded successfully.');
    } catch (err: any) {
      console.error('[HarvestController] getHarvests error:', err);
      return sendError(res, err.message || 'Could not load harvests.', 500);
    }
  }

  /**
   * Get single harvest batch by ID
   */
  static async getHarvestById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const harvest = await HarvestModel.findById(id);

      if (!harvest) {
        return sendError(res, 'Harvest batch not found.', 404);
      }

      return sendSuccess(res, harvest, 'Harvest details loaded.');
    } catch (err: any) {
      console.error('[HarvestController] getHarvestById error:', err);
      return sendError(res, err.message || 'Could not load harvest batch.', 500);
    }
  }

  /**
   * Farmer creates/schedules a new upcoming harvest batch
   */
  static async createHarvest(req: Request, res: Response) {
    try {
      const {
        farmerId,
        farmerName,
        farmerAvatar,
        farmerFarm,
        cropName,
        variety = 'Prime',
        category = 'Vegetables',
        image,
        expectedHarvestDate,
        estimatedYieldKg,
        minPreOrderQty = 20,
        preOrderPricePerKg,
        marketPricePerKg,
        depositPercent = 20,
        locationDistrict = 'Badulla',
        farmAddress = 'Govigedara, Welimada',
        fieldNotes = '',
        allowPreOrders = true,
      } = req.body;

      if (!farmerId || !cropName || !expectedHarvestDate || !estimatedYieldKg || !preOrderPricePerKg) {
        return sendError(res, 'Crop name, harvest date, estimated yield, and pre-order price are required.', 400);
      }

      const harvest = await HarvestModel.create({
        farmerId,
        farmerName: farmerName || 'Farmer',
        farmerAvatar: farmerAvatar || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400',
        farmerFarm: farmerFarm || 'Highland Farm',
        cropName,
        variety,
        category,
        image: image || 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=400',
        expectedHarvestDate,
        estimatedYieldKg: Number(estimatedYieldKg),
        reservedYieldKg: 0,
        minPreOrderQty: Number(minPreOrderQty),
        preOrderPricePerKg: Number(preOrderPricePerKg),
        marketPricePerKg: Number(marketPricePerKg || preOrderPricePerKg * 1.2),
        depositPercent: Number(depositPercent),
        locationDistrict,
        farmAddress,
        fieldNotes,
        allowPreOrders: allowPreOrders !== false,
        status: 'growing',
        preOrders: [],
      });

      return sendSuccess(res, harvest, 'Harvest scheduled successfully.');
    } catch (err: any) {
      console.error('[HarvestController] createHarvest error:', err);
      return sendError(res, err.message || 'Could not schedule harvest.', 500);
    }
  }

  /**
   * Buyer books a pre-order reservation for an upcoming harvest batch
   */
  static async preOrderHarvest(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const {
        buyerId,
        buyerName,
        buyerPhone,
        quantityKg,
        depositAmount,
        totalAmount,
        stripePaymentIntentId,
        orderId,
      } = req.body;

      if (!buyerId || !quantityKg || quantityKg <= 0) {
        return sendError(res, 'buyerId and valid quantityKg are required.', 400);
      }

      const harvest = await HarvestModel.findById(id);
      if (!harvest) {
        return sendError(res, 'Harvest batch not found.', 404);
      }

      const remainingKg = harvest.estimatedYieldKg - harvest.reservedYieldKg;
      if (quantityKg > remainingKg) {
        return sendError(res, `Only ${remainingKg} kg available for pre-order booking.`, 400);
      }

      const newPreOrder = {
        buyerId,
        buyerName: buyerName || 'Buyer',
        buyerPhone: buyerPhone || '',
        quantityKg: Number(quantityKg),
        depositAmount: Number(depositAmount),
        totalAmount: Number(totalAmount),
        orderId: orderId || '',
        stripePaymentIntentId: stripePaymentIntentId || '',
        bookedAt: new Date().toISOString(),
      };

      harvest.reservedYieldKg += Number(quantityKg);
      harvest.preOrders.push(newPreOrder);
      await harvest.save();

      return sendSuccess(
        res,
        { harvest, preOrder: newPreOrder },
        'Pre-order booked and secured with deposit.'
      );
    } catch (err: any) {
      console.error('[HarvestController] preOrderHarvest error:', err);
      return sendError(res, err.message || 'Could not book harvest pre-order.', 500);
    }
  }

  /**
   * Farmer updates harvest batch status
   */
  static async updateHarvestStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { status, actualYieldKg } = req.body;

      const valid = ['growing', 'ready_for_harvest', 'harvested', 'dispatched'];
      if (!status || !valid.includes(status)) {
        return sendError(res, 'Valid status is required.', 400);
      }

      const updateData: any = { status };
      if (actualYieldKg) {
        updateData.estimatedYieldKg = Number(actualYieldKg);
      }

      const harvest = await HarvestModel.findByIdAndUpdate(id, { $set: updateData }, { new: true });
      if (!harvest) {
        return sendError(res, 'Harvest batch not found.', 404);
      }

      return sendSuccess(res, harvest, `Harvest status updated to ${status}.`);
    } catch (err: any) {
      console.error('[HarvestController] updateHarvestStatus error:', err);
      return sendError(res, err.message || 'Failed to update harvest status.', 500);
    }
  }

  /**
   * Seed realistic upcoming harvest batches across Sri Lanka
   */
  static async seedDefaultHarvests() {
    const today = new Date();
    const addDays = (d: number) => {
      const t = new Date(today.getTime() + d * 24 * 60 * 60 * 1000);
      return t.toISOString().split('T')[0];
    };

    const seeds = [
      {
        farmerId: 'farmer-kusuma',
        farmerName: 'Kusuma Bandara',
        farmerAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400',
        farmerFarm: 'Govigedara Highland Farm',
        cropName: 'Organic Red Tomatoes (Grade A)',
        variety: 'Padma Hybrid',
        category: 'Vegetables',
        image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=400',
        expectedHarvestDate: addDays(4),
        estimatedYieldKg: 850,
        reservedYieldKg: 420,
        minPreOrderQty: 30,
        preOrderPricePerKg: 210,
        marketPricePerKg: 260,
        depositPercent: 20,
        locationDistrict: 'Badulla',
        farmAddress: 'Govigedara, Welimada',
        fieldNotes: 'Sun-ripened trellis grown tomatoes with zero synthetic pesticide sprays.',
        allowPreOrders: true,
        status: 'growing',
        preOrders: [
          {
            buyerId: 'buyer-sunil',
            buyerName: 'Sunil Dissanayake',
            quantityKg: 200,
            depositAmount: 8400,
            totalAmount: 42000,
            bookedAt: new Date().toISOString(),
          },
        ],
      },
      {
        farmerId: 'farmer-sunil-bandara',
        farmerName: 'Sunil Bandara',
        farmerAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
        farmerFarm: 'Kandurata Green Plots',
        cropName: 'Highland Carrots (Sweet Crisp)',
        variety: 'New Kuroda',
        category: 'Root Crops',
        image: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=400',
        expectedHarvestDate: addDays(7),
        estimatedYieldKg: 1200,
        reservedYieldKg: 650,
        minPreOrderQty: 50,
        preOrderPricePerKg: 230,
        marketPricePerKg: 290,
        depositPercent: 20,
        locationDistrict: 'Nuwara Eliya',
        farmAddress: 'Blackpool Fields, Nuwara Eliya',
        fieldNotes: 'Crisp high-altitude mountain carrots washed and graded before crate packing.',
        allowPreOrders: true,
        status: 'growing',
        preOrders: [],
      },
      {
        farmerId: 'farmer-priyantha',
        farmerName: 'Priyantha Alwis',
        farmerAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400',
        farmerFarm: 'Dry Zone Sweet Farms',
        cropName: 'Yellow Passion Fruit (Export Grade)',
        variety: 'Rahangala Gold',
        category: 'Fruits',
        image: 'https://images.unsplash.com/photo-1589533610925-1cffc309ebaa?w=400',
        expectedHarvestDate: addDays(11),
        estimatedYieldKg: 600,
        reservedYieldKg: 180,
        minPreOrderQty: 25,
        preOrderPricePerKg: 380,
        marketPricePerKg: 460,
        depositPercent: 25,
        locationDistrict: 'Kurunegala',
        farmAddress: 'Alawwa River Plot, Kurunegala',
        fieldNotes: 'High brix level sugar content passion fruit with thick skin for long shelf life.',
        allowPreOrders: true,
        status: 'growing',
        preOrders: [],
      },
      {
        farmerId: 'farmer-anura',
        farmerName: 'Anura Senanayake',
        farmerAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400',
        farmerFarm: 'Matale Spice Haven',
        cropName: 'Ceylon Green Cardamom (Jumbo Pods)',
        variety: 'Malabar Elite',
        category: 'Spices',
        image: 'https://images.unsplash.com/photo-1615485500704-8e990f9900f7?w=400',
        expectedHarvestDate: addDays(14),
        estimatedYieldKg: 250,
        reservedYieldKg: 80,
        minPreOrderQty: 10,
        preOrderPricePerKg: 6400,
        marketPricePerKg: 7800,
        depositPercent: 30,
        locationDistrict: 'Matale',
        farmAddress: 'Rattota Estate, Matale',
        fieldNotes: 'Kiln dried forest-canopy cardamom pods with rich green hue and intense aroma.',
        allowPreOrders: true,
        status: 'growing',
        preOrders: [],
      },
    ];

    return await HarvestModel.insertMany(seeds);
  }
}
