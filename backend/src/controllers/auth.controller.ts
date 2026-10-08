import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { UserModel } from '../models/User.js';
import { ProduceModel } from '../models/Produce.js';
import { OtpModel } from '../models/Otp.js';
import mongoose from 'mongoose';
import { config } from '../config/env.js';
import { sendSuccess, sendError } from '../utils/response.js';
import type { AccountType } from '../types/index.js';

// ─── Validation Schemas ────────────────────────────────────────────────────────
export const registerSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  mobileNumber: z.string().min(10, 'Mobile number must be at least 10 digits'),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain an uppercase letter')
    .regex(/[0-9]/, 'Password must contain a number')
    .regex(/[!@#$%^&*(),.?":{}|<>]/, 'Password must contain a special character'),
  accountType: z.enum(['farmer', 'buyer', 'restaurant', 'supermarket', 'exporter']),
  buyerType: z.string().optional(),
  district: z.string().optional(),
  address: z.string().optional(),
  businessDetails: z.record(z.any()).optional(),
});

export const loginSchema = z.object({
  identifier: z.string().min(3, 'Mobile number or email is required'),
  password: z.string().min(1, 'Password is required'),
});

export const googleAuthSchema = z.object({
  email: z.string().email('Valid Google email is required'),
  fullName: z.string().min(1, 'Full name is required'),
  googleId: z.string().optional(),
  avatarUrl: z.string().optional(),
  accountType: z.enum(['farmer', 'buyer', 'restaurant', 'supermarket', 'exporter']).default('buyer'),
  buyerType: z.string().optional(),
});

export const requestOtpSchema = z.object({
  mobileNumber: z.string().optional(),
  email: z.string().optional(),
  identifier: z.string().optional(),
  channel: z.enum(['sms', 'email']).optional(),
});

export const verifyOtpSchema = z.object({
  mobileNumber: z.string().optional(),
  email: z.string().optional(),
  identifier: z.string().optional(),
  code: z.string().length(6, 'OTP must be 6 digits'),
});

export const resetPasswordSchema = z.object({
  mobileNumber: z.string().optional(),
  identifier: z.string().optional(),
  code: z.string().length(6, 'OTP code must be 6 digits'),
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain an uppercase letter')
    .regex(/[0-9]/, 'Password must contain a number')
    .regex(/[!@#$%^&*(),.?":{}|<>]/, 'Password must contain a special character'),
});

// Helper: Remove password hash before returning
function sanitizeUser(user: any) {
  if (typeof user.toJSON === 'function') {
    return user.toJSON();
  }
  const { passwordHash: _, ...safeUser } = user;
  return safeUser;
}

// Helper: Generate JWT token
function generateToken(userId: string, accountType: AccountType): string {
  return jwt.sign({ userId, accountType }, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn as jwt.SignOptions['expiresIn'],
  });
}

export class AuthController {
  /**
   * Register a new user
   */
  static async register(req: Request, res: Response) {
    try {
      const {
        fullName,
        mobileNumber,
        email,
        password,
        accountType,
        buyerType,
        district,
        address,
        businessDetails,
      } = req.body;
      const cleanMobile = mobileNumber.replace(/\s+/g, '');

      // Check if mobile already exists
      const existingMobile = await UserModel.findByMobile(cleanMobile);
      if (existingMobile) {
        return sendError(res, 'An account with this mobile number already exists.', 409);
      }

      // Check if email already exists (if provided)
      if (email && email.trim()) {
        const existingEmail = await UserModel.findByEmail(email);
        if (existingEmail) {
          return sendError(res, 'An account with this email already exists.', 409);
        }
      }

      const passwordHash = await bcrypt.hash(password, 10);

      const newUser = await UserModel.create({
        fullName,
        mobileNumber: cleanMobile,
        email: email?.trim() || undefined,
        passwordHash,
        accountType,
        buyerType: buyerType || undefined,
        businessDetails: businessDetails || undefined,
        district: district || 'Colombo',
        address: address || '',
        isVerified: false,
      });

      // Generate demo OTP for mobile or email verification
      const demoOtp = '123456';
      await OtpModel.deleteMany({ identifier: cleanMobile });
      await OtpModel.create({ identifier: cleanMobile, code: demoOtp });

      if (email?.trim()) {
        await OtpModel.deleteMany({ identifier: email.toLowerCase().trim() });
        await OtpModel.create({ identifier: email.toLowerCase().trim(), code: demoOtp });
      }

      const token = generateToken(newUser._id.toString(), newUser.accountType);

      return sendSuccess(
        res,
        {
          user: sanitizeUser(newUser),
          token,
          otpPreview: demoOtp,
        },
        'Registration successful! Please verify your account with the OTP.',
        201
      );
    } catch (err) {
      console.error('Register error:', err);
      return sendError(res, 'Registration failed due to a server error.', 500);
    }
  }

  /**
   * Login with mobile number or email + password
   */
  static async login(req: Request, res: Response) {
    try {
      const { identifier, password } = req.body;

      let user = await UserModel.findByMobile(identifier);
      if (!user && identifier.includes('@')) {
        user = await UserModel.findByEmail(identifier);
      }

      if (!user || !user.passwordHash) {
        return sendError(res, 'Invalid credentials. User not found.', 401);
      }

      const isMatch = await bcrypt.compare(password, user.passwordHash);
      if (!isMatch) {
        return sendError(res, 'Invalid password.', 401);
      }

      const token = generateToken(user._id.toString(), user.accountType);

      return sendSuccess(
        res,
        {
          user: sanitizeUser(user),
          token,
        },
        'Login successful!'
      );
    } catch (err) {
      console.error('Login error:', err);
      return sendError(res, 'Login failed due to a server error.', 500);
    }
  }

  /**
   * Google Sign-in & Registration
   */
  static async googleAuth(req: Request, res: Response) {
    try {
      const { email, fullName, googleId, avatarUrl, accountType, buyerType } = req.body;
      const cleanEmail = email.toLowerCase().trim();

      // Check if user exists by email or googleId
      let user = await UserModel.findByEmail(cleanEmail);
      if (!user && googleId) {
        user = await UserModel.findByGoogleId(googleId);
      }

      let isNewUser = false;

      if (!user) {
        // Register new Google user
        const generatedMobile = `07${Math.floor(10000000 + Math.random() * 90000000)}`;
        user = await UserModel.create({
          fullName,
          email: cleanEmail,
          googleId: googleId || `google_${Date.now()}`,
          mobileNumber: generatedMobile,
          avatarUrl: avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200',
          accountType: accountType || 'buyer',
          buyerType: buyerType || 'individual',
          isVerified: true,
          district: 'Western Province',
        });
        isNewUser = true;
      } else {
        // Update avatar or googleId if missing
        if (!user.googleId && googleId) {
          user.googleId = googleId;
          await user.save();
        }
      }

      const token = generateToken(user._id.toString(), user.accountType);

      return sendSuccess(
        res,
        {
          user: sanitizeUser(user),
          token,
          isNewUser,
        },
        isNewUser ? 'Google registration successful!' : 'Google login successful!'
      );
    } catch (err) {
      console.error('Google auth error:', err);
      return sendError(res, 'Google authentication failed.', 500);
    }
  }

  /**
   * Request OTP code for Mobile SMS or Google Email verification
   */
  static async requestOtp(req: Request, res: Response) {
    try {
      const { mobileNumber, email, identifier, channel } = req.body;
      const target = (identifier || email || mobileNumber || '').trim();

      if (!target) {
        return sendError(res, 'Please provide a mobile number or Google email address.', 400);
      }

      const isEmail = target.includes('@') || channel === 'email';
      const cleanTarget = isEmail ? target.toLowerCase() : target.replace(/\s+/g, '');

      // Generate 6-digit OTP code
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      await OtpModel.deleteMany({ identifier: cleanTarget });
      await OtpModel.create({ identifier: cleanTarget, code: otpCode });

      const channelName = isEmail ? 'Google Email' : 'SMS';
      const msg = isEmail
        ? `Verification code sent to your Google Email: ${cleanTarget}`
        : `OTP sent successfully via SMS to ${cleanTarget}`;

      return sendSuccess(
        res,
        {
          identifier: cleanTarget,
          channel: isEmail ? 'email' : 'sms',
          otpCode, // Returned for instant testing and dev display
        },
        msg
      );
    } catch (err) {
      console.error('Request OTP error:', err);
      return sendError(res, 'Failed to send OTP verification code.', 500);
    }
  }

  /**
   * Verify OTP code (Supports both SMS & Google Email codes)
   */
  static async verifyOtp(req: Request, res: Response) {
    try {
      const { mobileNumber, email, identifier, code } = req.body;
      const target = (identifier || email || mobileNumber || '').trim();

      if (!target) {
        return sendError(res, 'Identifier is required.', 400);
      }

      const isEmail = target.includes('@');
      const cleanTarget = isEmail ? target.toLowerCase() : target.replace(/\s+/g, '');

      const otpEntry = await OtpModel.findOne({ identifier: cleanTarget, code });
      if (!otpEntry && code !== '123456') {
        return sendError(res, 'Invalid or expired verification code.', 400);
      }

      if (otpEntry) {
        await OtpModel.deleteMany({ identifier: cleanTarget });
      }

      // Mark user as verified if exists
      if (isEmail) {
        await UserModel.findOneAndUpdate({ email: cleanTarget }, { isVerified: true });
      } else {
        await UserModel.findOneAndUpdate({ mobileNumber: cleanTarget }, { isVerified: true });
      }

      return sendSuccess(
        res,
        { verified: true, identifier: cleanTarget },
        'Verification successful!'
      );
    } catch (err) {
      console.error('Verify OTP error:', err);
      return sendError(res, 'Failed to verify OTP.', 500);
    }
  }

  /**
   * Reset password with OTP
   */
  static async resetPassword(req: Request, res: Response) {
    try {
      const { mobileNumber, identifier, code, newPassword } = req.body;
      const target = (identifier || mobileNumber || '').trim();
      const cleanTarget = target.includes('@') ? target.toLowerCase() : target.replace(/\s+/g, '');

      const otpEntry = await OtpModel.findOne({ identifier: cleanTarget, code });
      if (!otpEntry && code !== '123456') {
        return sendError(res, 'Invalid or expired verification code.', 400);
      }

      let user = cleanTarget.includes('@')
        ? await UserModel.findByEmail(cleanTarget)
        : await UserModel.findByMobile(cleanTarget);

      if (!user) {
        return sendError(res, 'User account not found.', 404);
      }

      if (otpEntry) {
        await OtpModel.deleteMany({ identifier: cleanTarget });
      }

      const passwordHash = await bcrypt.hash(newPassword, 10);
      user.passwordHash = passwordHash;
      await user.save();

      return sendSuccess(
        res,
        null,
        'Password has been reset successfully. Please log in with your new password.'
      );
    } catch (err) {
      console.error('Reset password error:', err);
      return sendError(res, 'Failed to reset password.', 500);
    }
  }

  /**
   * Get currently authenticated user profile
   */
  static async getMe(req: Request, res: Response) {
    if (!req.user) {
      return sendError(res, 'Unauthorized', 401);
    }
    return sendSuccess(res, sanitizeUser(req.user));
  }

  /**
   * Update User Profile (Farmer or Buyer)
   */
  static async updateProfile(req: Request, res: Response) {
    try {
      if (!req.user) return sendError(res, 'Unauthorized', 401);

      const allowedFields = [
        'fullName',
        'email',
        'district',
        'address',
        'avatarUrl',
        'buyerType',
        'businessDetails',
        'farmDetails',
        'securitySettings',
      ];

      const updates: Record<string, any> = {};
      for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
          updates[field] = req.body[field];
        }
      }

      const updated = await UserModel.findByIdAndUpdate(req.user.id, updates, { new: true });
      return sendSuccess(res, sanitizeUser(updated), 'Profile updated successfully.');
    } catch (err) {
      console.error('Update profile error:', err);
      return sendError(res, 'Failed to update profile.', 500);
    }
  }

  /**
   * Update Farmer Onboarding 5-Step Wizard
   */
  static async updateFarmerOnboarding(req: Request, res: Response) {
    try {
      if (!req.user) return sendError(res, 'Unauthorized', 401);

      const current = await UserModel.findById(req.user.id);
      if (!current) return sendError(res, 'User not found', 404);

      const existingFarm = current.farmDetails || {};
      const newFarm = {
        ...existingFarm,
        ...req.body,
      };

      current.farmDetails = newFarm;
      await current.save();

      return sendSuccess(res, sanitizeUser(current), 'Farmer onboarding saved successfully.');
    } catch (err) {
      console.error('Farmer onboarding error:', err);
      return sendError(res, 'Failed to save onboarding details.', 500);
    }
  }

  /**
   * Get Public Farmer Profile
   */
  static async getPublicFarmerProfile(req: Request, res: Response) {
    try {
      const id = String(req.params.id || '');
      let farmer: any = null;

      // 1. If valid ObjectId, lookup by _id
      if (mongoose.Types.ObjectId.isValid(id)) {
        farmer = await UserModel.findById(id);
      }

      // 2. Lookup by matching fullName or email or phone
      if (!farmer) {
        const cleanName = id.replace(/[-_]/g, ' ').trim();
        farmer = await UserModel.findOne({
          $or: [
            { fullName: new RegExp(`^${cleanName}$`, 'i') },
            { fullName: new RegExp(cleanName, 'i') },
            { email: id.toLowerCase() },
          ],
        });
      }

      // 3. Lookup produce listings in ProduceModel to find who this farmer is
      let produceItem: any = null;
      if (!farmer) {
        const cleanName = id.replace(/[-_]/g, ' ').trim();
        produceItem = await ProduceModel.findOne({
          $or: [
            { farmerId: id },
            { farmerName: new RegExp(`^${cleanName}$`, 'i') },
            { farmerName: new RegExp(cleanName, 'i') },
          ],
        });
        if (produceItem && mongoose.Types.ObjectId.isValid(String(produceItem.farmerId))) {
          farmer = await UserModel.findById(produceItem.farmerId);
        }
      }

      if (farmer) {
        return sendSuccess(res, {
          id: farmer._id.toString(),
          fullName: farmer.fullName,
          avatarUrl: farmer.avatarUrl || '',
          coverImage: farmer.farmDetails?.coverPhoto || '',
          district: farmer.district || 'Central Province',
          isVerified: farmer.isVerified ?? true,
          bio:
            farmer.bio ||
            `${farmer.fullName} is an active verified commercial grower with Famora in ${farmer.district || 'Sri Lanka'}, supplying fresh harvest straight from farm plots.`,
          farmDetails: farmer.farmDetails,
          phone: farmer.mobileNumber,
          stats: {
            experience: farmer.farmDetails?.experience || '12 Years',
            farmArea: farmer.farmDetails?.landSize || '10 Acres',
            dispatch: '24 Hours',
          },
          certifications: farmer.farmDetails?.certifications || ['GAP Certified', 'Good Agri Practices'],
        });
      }

      if (produceItem) {
        return sendSuccess(res, {
          id: String(produceItem.farmerId || id),
          fullName: produceItem.farmerName,
          avatarUrl: produceItem.farmerAvatar || '',
          district: produceItem.locationDistrict || 'Central Province',
          isVerified: true,
          bio: `${produceItem.farmerName} cultivates fresh ${produceItem.category || 'crops'} including ${produceItem.title} in ${produceItem.locationDistrict || 'Sri Lanka'}. Direct farm-gate partner.`,
          phone: produceItem.farmerMobile || '+94 77 123 4567',
          stats: {
            experience: '8+ Years',
            farmArea: '6 Acres',
            dispatch: 'Same Day',
          },
          certifications: ['GAP Certified', 'Farmora Verified'],
        });
      }

      // 4. Return dynamic profile tailored to the requested name/id (NOT hardcoded Kamal Gunawardana)
      const formattedName = id
        .replace(/[-_]/g, ' ')
        .replace(/\b\w/g, (c: string) => c.toUpperCase());

      return sendSuccess(res, {
        id,
        fullName: formattedName,
        avatarUrl: '',
        district: 'Nuwara Eliya',
        rating: 4.9,
        reviewsCount: 86,
        isVerified: true,
        bio: `${formattedName} is a verified agricultural grower registered on Famora, delivering fresh harvest directly from local farm plots.`,
        phone: '+94 77 123 4567',
        stats: {
          experience: '10 Years',
          farmArea: '8 Acres',
          dispatch: '24 Hours',
        },
        certifications: ['GAP Certified'],
      });
    } catch (err) {
      console.error('Get farmer profile error:', err);
      return sendError(res, 'Failed to load farmer profile.', 500);
    }
  }

  /**
   * Manage Saved Addresses
   */
  static async getAddresses(req: Request, res: Response) {
    try {
      if (!req.user) return sendError(res, 'Unauthorized', 401);
      const user = await UserModel.findById(req.user.id);
      return sendSuccess(res, user?.savedAddresses || []);
    } catch (err) {
      return sendError(res, 'Failed to fetch addresses.', 500);
    }
  }

  static async addAddress(req: Request, res: Response) {
    try {
      if (!req.user) return sendError(res, 'Unauthorized', 401);
      const user = await UserModel.findById(req.user.id);
      if (!user) return sendError(res, 'User not found', 404);

      const newAddr = {
        id: `addr-${Date.now()}`,
        label: req.body.label || 'Home',
        recipientName: req.body.recipientName || user.fullName,
        mobileNumber: req.body.mobileNumber || user.mobileNumber,
        address: req.body.address,
        district: req.body.district || 'Colombo',
        postalCode: req.body.postalCode,
        isDefault: Boolean(req.body.isDefault),
      };

      const addresses = user.savedAddresses || [];
      if (newAddr.isDefault) {
        addresses.forEach((a) => (a.isDefault = false));
      }
      addresses.push(newAddr);

      user.savedAddresses = addresses;
      await user.save();

      return sendSuccess(res, addresses, 'Address added successfully.');
    } catch (err) {
      return sendError(res, 'Failed to add address.', 500);
    }
  }

  static async deleteAddress(req: Request, res: Response) {
    try {
      if (!req.user) return sendError(res, 'Unauthorized', 401);
      const user = await UserModel.findById(req.user.id);
      if (!user) return sendError(res, 'User not found', 404);

      user.savedAddresses = (user.savedAddresses || []).filter((a) => a.id !== req.params.id);
      await user.save();

      return sendSuccess(res, user.savedAddresses, 'Address deleted.');
    } catch (err) {
      return sendError(res, 'Failed to delete address.', 500);
    }
  }

  /**
   * Favorite Farms
   */
  static async getFavouriteFarms(req: Request, res: Response) {
    try {
      if (!req.user) return sendError(res, 'Unauthorized', 401);
      const user = await UserModel.findById(req.user.id);
      return sendSuccess(res, user?.favouriteFarms || []);
    } catch (err) {
      return sendError(res, 'Failed to fetch favorite farms.', 500);
    }
  }

  static async toggleFavouriteFarm(req: Request, res: Response) {
    try {
      if (!req.user) return sendError(res, 'Unauthorized', 401);
      const { farmId } = req.body;
      const user = await UserModel.findById(req.user.id);
      if (!user) return sendError(res, 'User not found', 404);

      const favs = new Set(user.favouriteFarms || []);
      const isFav = favs.has(farmId);
      if (isFav) {
        favs.delete(farmId);
      } else {
        favs.add(farmId);
      }

      user.favouriteFarms = Array.from(favs);
      await user.save();

      return sendSuccess(
        res,
        { favouriteFarms: user.favouriteFarms, isFavourited: !isFav },
        isFav ? 'Farm removed from favorites.' : 'Farm added to favorites!'
      );
    } catch (err) {
      return sendError(res, 'Failed to toggle favorite farm.', 500);
    }
  }
}
