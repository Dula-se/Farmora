import bcrypt from 'bcryptjs';
import { User, ProduceListing } from '../types/index.js';

class MockDatabase {
  private users: Map<string, User> = new Map();
  private produce: Map<string, ProduceListing> = new Map();
  private otps: Map<string, { code: string; expiresAt: number }> = new Map();

  constructor() {
    this.seed();
  }

  private seed() {
    const passwordHash = bcrypt.hashSync('Farmora@2026', 10);

    // Seed Farmer
    const sampleFarmer: User = {
      id: 'usr_farmer_01',
      fullName: 'Sunil Bandara',
      mobileNumber: '0771234567',
      email: 'sunil.farmer@famora.lk',
      passwordHash,
      accountType: 'farmer',
      district: 'Nuwara Eliya',
      address: 'Highland Organic Valley, Welimada',
      avatarUrl: 'https://images.unsplash.com/photo-1544717302-de2939b7ef71?w=400&auto=format&fit=crop&q=80',
      isVerified: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Seed Supermarket Buyer
    const sampleBuyer: User = {
      id: 'usr_buyer_01',
      fullName: 'Keells Logistics & Sourcing',
      mobileNumber: '0779876543',
      email: 'procurement@keells.lk',
      passwordHash,
      accountType: 'supermarket',
      district: 'Colombo',
      address: 'No 112, Vauxhall Street, Colombo 02',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
      isVerified: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.users.set(sampleFarmer.id, sampleFarmer);
    this.users.set(sampleBuyer.id, sampleBuyer);

    // Seed Produce listings
    const sampleProduce: ProduceListing[] = [
      {
        id: 'prd_001',
        farmerId: sampleFarmer.id,
        farmerName: sampleFarmer.fullName,
        farmerMobile: sampleFarmer.mobileNumber,
        farmerAvatar: sampleFarmer.avatarUrl,
        title: 'Fresh Nuwara Eliya Carrots (Grade A)',
        category: 'vegetables',
        description: 'Crisp, freshly harvested organic carrots from our Welimada hillside plots. Washed, graded, and packed in ventilated crates.',
        pricePerUnit: 340,
        currency: 'LKR',
        unit: 'kg',
        availableQuantity: 1200,
        minimumOrderQuantity: 25,
        harvestDate: new Date().toISOString().split('T')[0],
        locationDistrict: 'Nuwara Eliya',
        locationCity: 'Welimada',
        images: [
          'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1447175008436-054170c2e979?w=800&auto=format&fit=crop&q=80',
        ],
        isOrganic: true,
        isFeatured: true,
        status: 'available',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'prd_002',
        farmerId: sampleFarmer.id,
        farmerName: sampleFarmer.fullName,
        farmerMobile: sampleFarmer.mobileNumber,
        farmerAvatar: sampleFarmer.avatarUrl,
        title: 'Green Bell Peppers / Capsicum',
        category: 'vegetables',
        description: 'Greenhouse-grown crunchy capsicums with zero chemical residue. High shelf-life, ideal for commercial kitchens and supermarkets.',
        pricePerUnit: 520,
        currency: 'LKR',
        unit: 'kg',
        availableQuantity: 450,
        minimumOrderQuantity: 10,
        harvestDate: new Date().toISOString().split('T')[0],
        locationDistrict: 'Nuwara Eliya',
        locationCity: 'Kandapola',
        images: [
          'https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?w=800&auto=format&fit=crop&q=80',
        ],
        isOrganic: false,
        isFeatured: false,
        status: 'available',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'prd_003',
        farmerId: sampleFarmer.id,
        farmerName: sampleFarmer.fullName,
        farmerMobile: sampleFarmer.mobileNumber,
        farmerAvatar: sampleFarmer.avatarUrl,
        title: 'Ceylon Organic Red Papaya',
        category: 'fruits',
        description: 'Sweet, tree-ripened red lady papaya. Sourced from dry-zone solar irrigation orchards.',
        pricePerUnit: 220,
        currency: 'LKR',
        unit: 'kg',
        availableQuantity: 800,
        minimumOrderQuantity: 20,
        harvestDate: new Date().toISOString().split('T')[0],
        locationDistrict: 'Anuradhapura',
        locationCity: 'Tambuttegama',
        images: [
          'https://images.unsplash.com/photo-1517282009859-f000ec3b26fe?w=800&auto=format&fit=crop&q=80',
        ],
        isOrganic: true,
        isFeatured: true,
        status: 'available',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    sampleProduce.forEach((p) => this.produce.set(p.id, p));
  }

  // --- Users ---
  async findUserById(id: string): Promise<User | null> {
    return this.users.get(id) || null;
  }

  async findUserByMobile(mobileNumber: string): Promise<User | null> {
    const cleanNumber = mobileNumber.replace(/\s+/g, '');
    for (const user of this.users.values()) {
      if (user.mobileNumber.replace(/\s+/g, '') === cleanNumber) {
        return user;
      }
    }
    return null;
  }

  async findUserByEmail(email: string): Promise<User | null> {
    const lower = email.toLowerCase().trim();
    for (const user of this.users.values()) {
      if (user.email?.toLowerCase().trim() === lower) {
        return user;
      }
    }
    return null;
  }

  async createUser(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    const id = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();
    const newUser: User = {
      ...userData,
      id,
      createdAt: now,
      updatedAt: now,
    };
    this.users.set(id, newUser);
    return newUser;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | null> {
    const user = this.users.get(id);
    if (!user) return null;
    const updated: User = {
      ...user,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.users.set(id, updated);
    return updated;
  }

  // --- Produce ---
  async listProduce(filters?: {
    category?: string;
    district?: string;
    farmerId?: string;
    search?: string;
    minPrice?: number;
    maxPrice?: number;
  }): Promise<ProduceListing[]> {
    let results = Array.from(this.produce.values());

    if (filters?.category) {
      results = results.filter((p) => p.category.toLowerCase() === filters.category?.toLowerCase());
    }
    if (filters?.district) {
      results = results.filter(
        (p) => p.locationDistrict.toLowerCase() === filters.district?.toLowerCase()
      );
    }
    if (filters?.farmerId) {
      results = results.filter((p) => p.farmerId === filters.farmerId);
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      results = results.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.locationCity.toLowerCase().includes(q)
      );
    }
    if (filters?.minPrice !== undefined) {
      results = results.filter((p) => p.pricePerUnit >= (filters.minPrice ?? 0));
    }
    if (filters?.maxPrice !== undefined) {
      results = results.filter((p) => p.pricePerUnit <= (filters.maxPrice ?? Infinity));
    }

    return results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async findProduceById(id: string): Promise<ProduceListing | null> {
    return this.produce.get(id) || null;
  }

  async createProduce(data: Omit<ProduceListing, 'id' | 'createdAt' | 'updatedAt'>): Promise<ProduceListing> {
    const id = `prd_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();
    const newProduce: ProduceListing = {
      ...data,
      id,
      createdAt: now,
      updatedAt: now,
    };
    this.produce.set(id, newProduce);
    return newProduce;
  }

  async updateProduce(id: string, updates: Partial<ProduceListing>): Promise<ProduceListing | null> {
    const item = this.produce.get(id);
    if (!item) return null;
    const updated: ProduceListing = {
      ...item,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.produce.set(id, updated);
    return updated;
  }

  async deleteProduce(id: string): Promise<boolean> {
    return this.produce.delete(id);
  }

  // --- OTP Store ---
  setOtp(mobileOrEmail: string, code: string, ttlSeconds = 300) {
    this.otps.set(mobileOrEmail, {
      code,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  verifyOtp(mobileOrEmail: string, code: string): boolean {
    const entry = this.otps.get(mobileOrEmail);
    if (!entry) return false;
    if (Date.now() > entry.expiresAt) {
      this.otps.delete(mobileOrEmail);
      return false;
    }
    const isValid = entry.code === code;
    if (isValid) {
      this.otps.delete(mobileOrEmail);
    }
    return isValid;
  }
}

export const db = new MockDatabase();
