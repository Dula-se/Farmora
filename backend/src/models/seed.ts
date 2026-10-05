import bcrypt from 'bcryptjs';
import { UserModel } from './User.js';
import { ProduceModel } from './Produce.js';

/**
 * Seeds the database with initial demo data on first run.
 * Skips gracefully if data already exists.
 */
export async function seedDatabase(): Promise<void> {
  const existingUsers = await UserModel.countDocuments();
  if (existingUsers > 0) {
    console.log('[Seed] Database already seeded — skipping.');
    return;
  }

  console.log('[Seed] Seeding initial demo data...');
  const passwordHash = await bcrypt.hash('Farmora@2026', 10);

  const farmer = await UserModel.create({
    fullName: 'Sunil Bandara',
    mobileNumber: '0771234567',
    email: 'sunil.farmer@farmora.lk',
    passwordHash,
    accountType: 'farmer',
    district: 'Nuwara Eliya',
    address: 'Highland Organic Valley, Welimada',
    avatarUrl:
      'https://images.unsplash.com/photo-1544717302-de2939b7ef71?w=400&auto=format&fit=crop&q=80',
    isVerified: true,
  });

  await UserModel.create({
    fullName: 'Keells Logistics & Sourcing',
    mobileNumber: '0779876543',
    email: 'procurement@keells.lk',
    passwordHash,
    accountType: 'supermarket',
    district: 'Colombo',
    address: 'No 112, Vauxhall Street, Colombo 02',
    avatarUrl:
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
    isVerified: true,
  });

  await ProduceModel.insertMany([
    {
      farmerId: farmer._id,
      farmerName: farmer.fullName,
      farmerMobile: farmer.mobileNumber,
      farmerAvatar: farmer.avatarUrl,
      title: 'Fresh Nuwara Eliya Carrots (Grade A)',
      category: 'vegetables',
      description:
        'Crisp, freshly harvested organic carrots from our Welimada hillside plots. Washed, graded, and packed in ventilated crates.',
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
    },
    {
      farmerId: farmer._id,
      farmerName: farmer.fullName,
      farmerMobile: farmer.mobileNumber,
      farmerAvatar: farmer.avatarUrl,
      title: 'Green Bell Peppers / Capsicum',
      category: 'vegetables',
      description:
        'Greenhouse-grown crunchy capsicums with zero chemical residue. High shelf-life, ideal for commercial kitchens and supermarkets.',
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
    },
    {
      farmerId: farmer._id,
      farmerName: farmer.fullName,
      farmerMobile: farmer.mobileNumber,
      farmerAvatar: farmer.avatarUrl,
      title: 'Ceylon Organic Red Papaya',
      category: 'fruits',
      description:
        'Sweet, tree-ripened red lady papaya. Sourced from dry-zone solar irrigation orchards.',
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
    },
    {
      farmerId: farmer._id,
      farmerName: farmer.fullName,
      farmerMobile: farmer.mobileNumber,
      farmerAvatar: farmer.avatarUrl,
      title: 'Organic Red Tomatoes',
      category: 'vegetables',
      description:
        'Freshly harvested vine-ripened organic red tomatoes from our highland farm in Nuwara Eliya. High brix sweetness, zero synthetic chemicals. Washed and packed in 10kg crates.',
      pricePerUnit: 320,
      currency: 'LKR',
      unit: 'kg',
      availableQuantity: 1500,
      minimumOrderQuantity: 10,
      harvestDate: new Date().toISOString().split('T')[0],
      locationDistrict: 'Nuwara Eliya',
      locationCity: 'Welimada',
      images: [
        'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1546470427-e26264be0b11?w=800&auto=format&fit=crop&q=80',
      ],
      isOrganic: true,
      isFeatured: true,
      status: 'available',
    },
    {
      farmerId: farmer._id,
      farmerName: farmer.fullName,
      farmerMobile: farmer.mobileNumber,
      farmerAvatar: farmer.avatarUrl,
      title: 'Ampitiya Sweet Tomatoes',
      category: 'vegetables',
      description:
        'Locally grown ripe cooking tomatoes with tender skin and rich flavor. Daily direct harvest from Kandy plots.',
      pricePerUnit: 280,
      currency: 'LKR',
      unit: 'kg',
      availableQuantity: 650,
      minimumOrderQuantity: 15,
      harvestDate: new Date().toISOString().split('T')[0],
      locationDistrict: 'Kandy',
      locationCity: 'Ampitiya',
      images: [
        'https://images.unsplash.com/photo-1582284540020-8acbe03f4924?w=800&auto=format&fit=crop&q=80',
      ],
      isOrganic: false,
      isFeatured: false,
      status: 'available',
    },
    {
      farmerId: farmer._id,
      farmerName: farmer.fullName,
      farmerMobile: farmer.mobileNumber,
      farmerAvatar: farmer.avatarUrl,
      title: 'Jaffna Purple Red Onions',
      category: 'vegetables',
      description:
        'Aromatic, pungent sun-dried red onions. High shelf-life, dry skin, cured for long commercial storage.',
      pricePerUnit: 450,
      currency: 'LKR',
      unit: 'kg',
      availableQuantity: 900,
      minimumOrderQuantity: 20,
      harvestDate: new Date().toISOString().split('T')[0],
      locationDistrict: 'Jaffna',
      locationCity: 'Chavakachcheri',
      images: [
        'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=800&auto=format&fit=crop&q=80',
      ],
      isOrganic: true,
      isFeatured: true,
      status: 'available',
    },
  ]);

  console.log('[Seed] ✅ Demo data seeded successfully.');
}
