process.env.NODE_ENV = 'test';
import test, { describe, it } from 'node:test';
import assert from 'node:assert';

describe('Produce & Marketplace Validation Rules', () => {
  const VALID_CATEGORIES = ['Vegetables', 'Fruits', 'Grains', 'Spices', 'Tea', 'Herbs'] as const;
  const VALID_UNITS = ['kg', 'g', 'bunch', 'bag', 'box', 'piece'] as const;

  interface ProduceInput {
    title: string;
    category: string;
    pricePerUnit: number;
    unit: string;
    quantityAvailable: number;
  }

  const validateProduce = (input: Partial<ProduceInput>): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (!input.title || input.title.trim().length < 3) {
      errors.push('Title must be at least 3 characters');
    }

    if (!input.category || !VALID_CATEGORIES.includes(input.category as any)) {
      errors.push(`Category must be one of: ${VALID_CATEGORIES.join(', ')}`);
    }

    if (input.pricePerUnit === undefined || input.pricePerUnit <= 0) {
      errors.push('Price per unit must be greater than 0');
    }

    if (!input.unit || !VALID_UNITS.includes(input.unit as any)) {
      errors.push(`Unit must be one of: ${VALID_UNITS.join(', ')}`);
    }

    if (input.quantityAvailable === undefined || input.quantityAvailable < 0) {
      errors.push('Quantity available cannot be negative');
    }

    return { valid: errors.length === 0, errors };
  };

  it('should accept valid produce listing data', () => {
    const item: ProduceInput = {
      title: 'Fresh Organic Carrots',
      category: 'Vegetables',
      pricePerUnit: 350,
      unit: 'kg',
      quantityAvailable: 150,
    };
    const result = validateProduce(item);
    assert.strictEqual(result.valid, true);
    assert.strictEqual(result.errors.length, 0);
  });

  it('should reject produce with negative price or zero price', () => {
    const item: ProduceInput = {
      title: 'Tomatoes',
      category: 'Vegetables',
      pricePerUnit: 0,
      unit: 'kg',
      quantityAvailable: 50,
    };
    const result = validateProduce(item);
    assert.strictEqual(result.valid, false);
    assert.ok(result.errors.some((e) => e.includes('greater than 0')));
  });

  it('should reject invalid category', () => {
    const item: ProduceInput = {
      title: 'Heavy Machinery',
      category: 'Electronics',
      pricePerUnit: 5000,
      unit: 'piece',
      quantityAvailable: 1,
    };
    const result = validateProduce(item);
    assert.strictEqual(result.valid, false);
    assert.ok(result.errors.some((e) => e.includes('Category must be one of')));
  });

  describe('Bidding Mechanism Logic', () => {
    const validateBid = (
      currentHighestBid: number,
      startingPrice: number,
      newBidAmount: number,
      minIncrement: number = 50
    ): { valid: boolean; message?: string } => {
      const basePrice = currentHighestBid > 0 ? currentHighestBid : startingPrice;
      const minimumAcceptable = basePrice + minIncrement;

      if (newBidAmount < minimumAcceptable) {
        return {
          valid: false,
          message: `Bid must be at least LKR ${minimumAcceptable} (min increment: LKR ${minIncrement})`,
        };
      }
      return { valid: true };
    };

    it('should allow bid higher than current highest bid by minimum increment', () => {
      const result = validateBid(1000, 800, 1050, 50);
      assert.strictEqual(result.valid, true);
    });

    it('should reject bid lower than current highest bid', () => {
      const result = validateBid(1000, 800, 950, 50);
      assert.strictEqual(result.valid, false);
      assert.ok(result.message?.includes('Bid must be at least LKR 1050'));
    });

    it('should reject bid matching current highest without meeting increment', () => {
      const result = validateBid(1000, 800, 1020, 50);
      assert.strictEqual(result.valid, false);
    });
  });
});
