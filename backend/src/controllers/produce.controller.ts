import { Request, Response } from 'express';
import { z } from 'zod';
import { ProduceModel } from '../models/Produce.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { ProduceCategory, ProduceUnit } from '../types/index.js';

export const createProduceSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  category: z.enum(['vegetables', 'fruits', 'grains', 'spices', 'organic', 'tea', 'other']),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  pricePerUnit: z.number().positive('Price must be greater than zero'),
  unit: z.enum(['kg', 'g', 'bundle', 'crate', 'item']).default('kg'),
  availableQuantity: z.number().positive('Available quantity must be greater than zero'),
  minimumOrderQuantity: z.number().positive().default(1),
  harvestDate: z.string().optional(),
  locationDistrict: z.string().min(2, 'District is required'),
  locationCity: z.string().min(2, 'City is required'),
  images: z.array(z.string().url('Image must be a valid URL')).min(1, 'At least one image is required'),
  isOrganic: z.boolean().optional().default(false),
});

export const updateProduceSchema = z.object({
  title: z.string().min(3).optional(),
  category: z.enum(['vegetables', 'fruits', 'grains', 'spices', 'organic', 'tea', 'other']).optional(),
  description: z.string().min(10).optional(),
  pricePerUnit: z.number().positive().optional(),
  unit: z.enum(['kg', 'g', 'bundle', 'crate', 'item']).optional(),
  availableQuantity: z.number().nonnegative().optional(),
  minimumOrderQuantity: z.number().positive().optional(),
  harvestDate: z.string().optional(),
  locationDistrict: z.string().optional(),
  locationCity: z.string().optional(),
  images: z.array(z.string().url()).optional(),
  isOrganic: z.boolean().optional(),
  status: z.enum(['available', 'sold_out', 'archived']).optional(),
});

export class ProduceController {
  /**
   * List all available produce listings with search & filter support
   */
  static async getAll(req: Request, res: Response) {
    try {
      const { category, district, farmerId, search, minPrice, maxPrice } = req.query;

      const filter: Record<string, any> = {};

      if (category) {
        filter.category = (category as string).toLowerCase();
      }
      if (district) {
        filter.locationDistrict = new RegExp(`^${district}$`, 'i');
      }
      if (farmerId) {
        filter.farmerId = farmerId;
      }
      if (search) {
        const q = String(search).trim();
        filter.$or = [
          { title: { $regex: q, $options: 'i' } },
          { description: { $regex: q, $options: 'i' } },
          { locationCity: { $regex: q, $options: 'i' } },
        ];
      }
      if (minPrice !== undefined || maxPrice !== undefined) {
        filter.pricePerUnit = {};
        if (minPrice !== undefined) filter.pricePerUnit.$gte = parseFloat(minPrice as string);
        if (maxPrice !== undefined) filter.pricePerUnit.$lte = parseFloat(maxPrice as string);
      }

      const items = await ProduceModel.find(filter).sort({ createdAt: -1 });

      return sendSuccess(res, items, 'Produce listings retrieved successfully', 200, {
        total: items.length,
      });
    } catch (err) {
      console.error('List produce error:', err);
      return sendError(res, 'Failed to fetch produce listings', 500);
    }
  }

  /**
   * Get single produce listing by ID
   */
  static async getById(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      const produce = await ProduceModel.findById(id);

      if (!produce) {
        return sendError(res, 'Produce listing not found', 404);
      }

      return sendSuccess(res, produce);
    } catch (err) {
      console.error('Get produce error:', err);
      return sendError(res, 'Failed to retrieve produce details', 500);
    }
  }

  /**
   * Create a new produce listing (Farmer only)
   */
  static async create(req: Request, res: Response) {
    try {
      const user = req.user!;
      const userId = (user as any)._id || user.id;
      const data = req.body;

      const newProduce = await ProduceModel.create({
        farmerId: userId,
        farmerName: user.fullName,
        farmerMobile: user.mobileNumber,
        farmerAvatar: user.avatarUrl,
        title: data.title,
        category: data.category as ProduceCategory,
        description: data.description,
        pricePerUnit: Number(data.pricePerUnit),
        currency: 'LKR',
        unit: (data.unit as ProduceUnit) || 'kg',
        availableQuantity: Number(data.availableQuantity),
        minimumOrderQuantity: Number(data.minimumOrderQuantity || 1),
        harvestDate: data.harvestDate || new Date().toISOString().split('T')[0],
        locationDistrict: data.locationDistrict,
        locationCity: data.locationCity,
        images: data.images || [],
        isOrganic: Boolean(data.isOrganic),
        status: 'available',
      });

      return sendSuccess(res, newProduce, 'Produce listing created successfully!', 201);
    } catch (err) {
      console.error('Create produce error:', err);
      return sendError(res, 'Failed to create produce listing', 500);
    }
  }

  /**
   * Update produce listing
   */
  static async update(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      const user = req.user!;
      const userId = ((user as any)._id || user.id).toString();

      const existing = await ProduceModel.findById(id);
      if (!existing) {
        return sendError(res, 'Produce listing not found', 404);
      }

      // Check ownership
      if (existing.farmerId.toString() !== userId) {
        return sendError(res, 'You are not authorized to edit this listing', 403);
      }

      const updated = await ProduceModel.findByIdAndUpdate(id, req.body, { new: true });
      return sendSuccess(res, updated, 'Produce listing updated successfully');
    } catch (err) {
      console.error('Update produce error:', err);
      return sendError(res, 'Failed to update produce listing', 500);
    }
  }

  /**
   * Delete produce listing
   */
  static async delete(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      const user = req.user!;
      const userId = ((user as any)._id || user.id).toString();

      const existing = await ProduceModel.findById(id);
      if (!existing) {
        return sendError(res, 'Produce listing not found', 404);
      }

      // Check ownership
      if (existing.farmerId.toString() !== userId) {
        return sendError(res, 'You are not authorized to delete this listing', 403);
      }

      await ProduceModel.findByIdAndDelete(id);
      return sendSuccess(res, null, 'Produce listing removed successfully');
    } catch (err) {
      console.error('Delete produce error:', err);
      return sendError(res, 'Failed to delete produce listing', 500);
    }
  }

  /**
   * Get listings created by the logged-in farmer
   */
  static async getMyListings(req: Request, res: Response) {
    try {
      const user = req.user!;
      const userId = (user as any)._id || user.id;
      const listings = await ProduceModel.find({ farmerId: userId }).sort({ createdAt: -1 });
      return sendSuccess(res, listings, 'Your listings fetched successfully');
    } catch (err) {
      console.error('Get my listings error:', err);
      return sendError(res, 'Failed to fetch your listings', 500);
    }
  }
}
