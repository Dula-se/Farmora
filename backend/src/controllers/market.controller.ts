import { Request, Response } from 'express';
import { sendSuccess, sendError } from '../utils/response.js';

export class MarketController {
  /**
   * District-by-district price comparison (Screen 9 in Figma)
   */
  static async getDistrictCompare(req: Request, res: Response) {
    try {
      const crop = (req.query.crop as string) || 'Tomato';
      const localDistrict = (req.query.district as string) || 'Nuwara Eliya';

      const data = {
        crop,
        localDistrict,
        localAveragePrice: 350,
        currency: 'Rs.',
        unit: 'kg',
        updatedAt: 'Today, 06:00 AM',
        districts: [
          {
            name: 'Colombo (Manning Market)',
            price: 410,
            diffPercent: '+17%',
            diffStatus: 'higher',
            demand: 'Very High',
            distanceKm: 145,
            netAdvantage: 'Rs. +45/kg after transport',
          },
          {
            name: 'Dambulla Economic Centre',
            price: 320,
            diffPercent: '-8%',
            diffStatus: 'lower',
            demand: 'High',
            distanceKm: 85,
            netAdvantage: 'High volume wholesale',
          },
          {
            name: 'Kandy Central Market',
            price: 380,
            diffPercent: '+8%',
            diffStatus: 'higher',
            demand: 'Moderate',
            distanceKm: 65,
            netAdvantage: 'Rs. +22/kg after transport',
          },
          {
            name: 'Meegoda Dedicated Centre',
            price: 395,
            diffPercent: '+13%',
            diffStatus: 'higher',
            demand: 'High',
            distanceKm: 135,
            netAdvantage: 'Direct supermarket retail buyers',
          },
        ],
        recommendation:
          'Shipping this week to Colombo Manning Market yields a +17% higher net profit margin even factoring transport costs.',
      };

      return sendSuccess(res, data, 'District price comparison retrieved');
    } catch (err) {
      console.error('District compare error:', err);
      return sendError(res, 'Failed to retrieve district prices', 500);
    }
  }

  /**
   * Wholesale vs Retail pricing calculator (Screen 10 in Figma)
   */
  static async getWholesaleVsRetail(req: Request, res: Response) {
    try {
      const crop = (req.query.crop as string) || 'Organic Red Tomatoes';

      const data = {
        crop,
        basePrice: 350,
        wholesaleTier: {
          price: 280,
          unit: 'kg',
          minOrderQty: 50,
          discountPercent: '20% OFF',
          pros: [
            'Instant bulk clearance',
            'Lower packaging & handling costs',
            'Guaranteed supermarket buyers',
          ],
          turnaroundHours: '24 - 48 hrs',
        },
        retailTier: {
          price: 350,
          unit: 'kg',
          minOrderQty: 2,
          discountPercent: 'Standard Rate',
          pros: [
            'Maximum profit margin per kg',
            'Direct household & cafe buyers',
            'Builds repeat regular buyers',
          ],
          turnaroundHours: '3 - 5 days',
        },
        recommendedStrategy:
          'Split inventory: Allocate 70% of harvest to Wholesale (50kg+ tier) for quick cash flow and 30% for direct retail.',
      };

      return sendSuccess(res, data, 'Wholesale vs retail strategy retrieved');
    } catch (err) {
      console.error('Wholesale vs retail error:', err);
      return sendError(res, 'Failed to calculate pricing strategy', 500);
    }
  }

  /**
   * Market trends & 7-day historical prices (Screen 11 in Figma)
   */
  static async getMarketTrends(req: Request, res: Response) {
    try {
      const crop = (req.query.crop as string) || 'Organic Red Tomatoes';
      const district = (req.query.district as string) || 'Nuwara Eliya';

      const data = {
        crop,
        district,
        currentWholesalePrice: 340,
        priceChangeToday: '+Rs. 12',
        trendDirection: 'up',
        qualityGrade: 'Grade A',
        history: [
          { day: 'Mon', date: 'Oct 01', price: 300, volume: '4.2 tons' },
          { day: 'Tue', date: 'Oct 02', price: 310, volume: '4.8 tons' },
          { day: 'Wed', date: 'Oct 03', price: 315, volume: '3.9 tons' },
          { day: 'Thu', date: 'Oct 04', price: 328, volume: '3.5 tons' },
          { day: 'Fri', date: 'Oct 05', price: 335, volume: '3.1 tons' },
          { day: 'Sat', date: 'Oct 06', price: 340, volume: '2.9 tons' },
        ],
        forecast: {
          expectedNextWeek: 'Rs. 355 - 375 / kg',
          trend: 'Bullish (Upward)',
          reason:
            'Heavy monsoon rains expected in Central Province will limit harvesting, pushing market supply lower and farmgate prices higher.',
        },
      };

      return sendSuccess(res, data, 'Market trend intelligence retrieved');
    } catch (err) {
      console.error('Market trends error:', err);
      return sendError(res, 'Failed to fetch market trends', 500);
    }
  }

  /**
   * Farmer Trust Score & Quality Rating (Screen 12 in Figma)
   */
  static async getFarmerTrustScore(req: Request, res: Response) {
    try {
      const farmerId = req.params.farmerId || (req.user ? (req.user as any)._id || req.user.id : 'demo_farmer');

      const data = {
        farmerId,
        score: 94,
        grade: 'Grade A+ Certified Farmer',
        ranking: 'Top 5% of farmers in Central Province',
        reviewCount: 48,
        metrics: [
          { label: 'Quality Consistency', percentage: 96, color: '#22C55E' },
          { label: 'On-Time Dispatch', percentage: 92, color: '#3B82F6' },
          { label: 'Buyer Satisfaction', percentage: 95, color: '#10B981' },
          { label: 'Packaging & Handling', percentage: 93, color: '#F59E0B' },
        ],
        badges: [
          { name: 'Verified Farm', icon: '🎖️', description: 'Land deed & address verified by Agrarian Services' },
          { name: '100% Organic', icon: '🌿', description: 'Pesticide-free certified highland soil' },
          { name: 'Fast Shipper', icon: '⚡', description: '98% of orders dispatched within 24 hours' },
          { name: 'Top Rated 2026', icon: '🌟', description: 'Awarded for zero return requests' },
        ],
        growthTips: [
          'Maintain same-day dispatch for next 5 orders to earn the "Ultra Reliable" badge.',
          'Upload photo verification of your cold-storage area to gain +2 points.',
        ],
      };

      return sendSuccess(res, data, 'Farmer trust score retrieved');
    } catch (err) {
      console.error('Farmer trust score error:', err);
      return sendError(res, 'Failed to retrieve trust score', 500);
    }
  }
}
