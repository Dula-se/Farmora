process.env.NODE_ENV = 'test';
import test, { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import { app } from '../src/app.js';
import { connectDB, disconnectDB } from '../src/config/database.js';
import { AuctionModel } from '../src/models/Auction.js';
import { OrderModel } from '../src/models/Order.js';

describe('Order & Bid Deletion Automated Tests', () => {
  before(async () => {
    try {
      await connectDB();
    } catch {}
  });

  after(async () => {
    await disconnectDB();
  });

  describe('Order Deletion API', () => {
    it('should create an order and successfully delete it by ID', async () => {
      // 1. Create a dummy order
      const newOrder = await OrderModel.create({
        orderNumber: `FAM-TEST-${Date.now()}`,
        buyerId: 'buyer-test-del',
        buyerName: 'Test Buyer',
        buyerPhone: '+94 77 111 2222',
        buyerLocation: 'Colombo',
        farmerId: 'farmer-test',
        farmerName: 'Farmer Test',
        items: [
          {
            produceTitle: 'Test Veg',
            quantity: 10,
            unit: 'kg',
            unitPrice: 100,
            totalPrice: 1000,
          },
        ],
        subtotal: 1000,
        deliveryFee: 200,
        totalAmount: 1200,
        trackingNumber: 'TRK-TEST-DEL',
        status: 'pending_dispatch',
        orderDate: 'Today',
        expectedDelivery: 'Tomorrow',
      });

      const orderId = newOrder._id.toString();

      // 2. Call DELETE /api/orders/:id
      const delRes = await request(app).delete(`/api/orders/${orderId}`);
      assert.strictEqual(delRes.status, 200);
      assert.strictEqual(delRes.body.success, true);
      assert.ok(delRes.body.message.includes('deleted'));

      // 3. Verify it no longer exists
      const checkRes = await request(app).get(`/api/orders/${orderId}`);
      assert.strictEqual(checkRes.status, 404);
    });

    it('should return 404 when attempting to delete a non-existent order', async () => {
      const res = await request(app).delete('/api/orders/non_existent_ord_999999');
      assert.strictEqual(res.status, 404);
      assert.strictEqual(res.body.success, false);
    });
  });

  describe('Auction & Bid Deletion API', () => {
    it('should allow retracting/deleting a bid and properly recalculate highest bid', async () => {
      // 1. Create a live auction
      const auction = await AuctionModel.create({
        farmerId: 'farmer-test-bid',
        farmerName: 'Test Farmer',
        cropName: 'Organic Potatoes',
        image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea',
        lotSizeKg: 100,
        unit: 'kg',
        startingPricePerKg: 150,
        reservePricePerKg: 180,
        minBidIncrement: 10,
        currentBidPerKg: 200,
        highestBidderId: 'buyer-lead',
        highestBidderName: 'Lead Buyer',
        bidsCount: 2,
        bids: [
          {
            bidderId: 'buyer-lead',
            bidderName: 'Lead Buyer',
            bidAmountPerKg: 200,
            totalLotAmount: 20000,
            timestamp: new Date().toISOString(),
          },
          {
            bidderId: 'buyer-second',
            bidderName: 'Second Buyer',
            bidAmountPerKg: 180,
            totalLotAmount: 18000,
            timestamp: new Date(Date.now() - 60000).toISOString(),
          },
        ],
        startTime: new Date().toISOString(),
        endTime: new Date(Date.now() + 3600000).toISOString(),
        status: 'live',
        locationDistrict: 'Nuwara Eliya',
      });

      const auctionId = auction._id.toString();

      // 2. Retract leading bid (buyer-lead)
      const retractRes = await request(app)
        .delete(`/api/auctions/${auctionId}/bid`)
        .send({ bidderId: 'buyer-lead' });

      assert.strictEqual(retractRes.status, 200);
      assert.strictEqual(retractRes.body.success, true);

      // Verify recalculated leader is now 'buyer-second' at Rs. 180
      const updatedAuction = retractRes.body.data;
      assert.strictEqual(updatedAuction.bidsCount, 1);
      assert.strictEqual(updatedAuction.currentBidPerKg, 180);
      assert.strictEqual(updatedAuction.highestBidderId, 'buyer-second');
      assert.strictEqual(updatedAuction.highestBidderName, 'Second Buyer');

      // 3. Retract the remaining bid
      const retractSecondRes = await request(app)
        .delete(`/api/auctions/${auctionId}/bid`)
        .send({ bidderId: 'buyer-second' });

      assert.strictEqual(retractSecondRes.status, 200);
      const zeroBidsAuction = retractSecondRes.body.data;
      assert.strictEqual(zeroBidsAuction.bidsCount, 0);
      assert.strictEqual(zeroBidsAuction.currentBidPerKg, 150); // back to starting price
      assert.strictEqual(zeroBidsAuction.highestBidderId, '');

      // 4. Delete the entire auction lot
      const delAuctionRes = await request(app).delete(`/api/auctions/${auctionId}`);
      assert.strictEqual(delAuctionRes.status, 200);
      assert.strictEqual(delAuctionRes.body.success, true);

      // Verify auction is gone
      const verifyAucRes = await request(app).get(`/api/auctions/${auctionId}`);
      assert.strictEqual(verifyAucRes.status, 404);
    });
  });
});
