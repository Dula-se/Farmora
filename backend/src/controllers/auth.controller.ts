import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { db } from '../models/mockDb.js';
import { config } from '../config/env.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { AccountType, User } from '../types/index.js';

// Validation Schemas
export const registerSchema = z.object({
  fullName: z.string().min(2, 'Full name must have at least 2 characters'),
  mobileNumber: z.string().regex(/^0\d{9}$/, 'Must be a valid 10-digit Sri Lankan mobile number (e.g. 0771234567)'),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain an uppercase letter')
    .regex(/[0-9]/, 'Password must contain a number')
    .regex(/[!@#$%^&*(),.?":{}|<>]/, 'Password must contain a special character'),
  accountType: z.enum(['farmer', 'buyer', 'restaurant', 'supermarket', 'exporter']),
  district: z.string().optional(),
  address: z.string().optional(),
});

export const loginSchema = z.object({
  identifier: z.string().min(3, 'Mobile number or email is required'),
  password: z.string().min(1, 'Password is required'),
});

export const requestOtpSchema = z.object({
  mobileNumber: z.string().min(10, 'Mobile number is required'),
});

export const verifyOtpSchema = z.object({
  mobileNumber: z.string().min(10, 'Mobile number is required'),
  code: z.string().length(6, 'OTP must be 6 digits'),
});

export const resetPasswordSchema = z.object({
  mobileNumber: z.string().min(10, 'Mobile number is required'),
  code: z.string().length(6, 'OTP code must be 6 digits'),
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain an uppercase letter')
    .regex(/[0-9]/, 'Password must contain a number')
    .regex(/[!@#$%^&*(),.?":{}|<>]/, 'Password must contain a special character'),
});

// Helper: Remove password hash before returning
function sanitizeUser(user: User): Omit<User, 'passwordHash'> {
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
      const { fullName, mobileNumber, email, password, accountType, district, address } = req.body;

      // Check if mobile already exists
      const existingMobile = await db.findUserByMobile(mobileNumber);
      if (existingMobile) {
        return sendError(res, 'An account with this mobile number already exists.', 409);
      }

      // Check if email already exists (if provided)
      if (email && email.trim()) {
        const existingEmail = await db.findUserByEmail(email);
        if (existingEmail) {
          return sendError(res, 'An account with this email already exists.', 409);
        }
      }

      const passwordHash = await bcrypt.hash(password, 10);

      const newUser = await db.createUser({
        fullName,
        mobileNumber: mobileNumber.replace(/\s+/g, ''),
        email: email?.trim() || undefined,
        passwordHash,
        accountType,
        district: district || 'Colombo',
        address: address || '',
        isVerified: false,
      });

      // Generate demo OTP for mobile verification
      const demoOtp = '123456';
      db.setOtp(newUser.mobileNumber, demoOtp);

      const token = generateToken(newUser.id, newUser.accountType);

      return sendSuccess(
        res,
        {
          user: sanitizeUser(newUser),
          token,
          otpPreview: demoOtp, // Returned in dev mode for easy testing!
        },
        'Registration successful! Please verify your mobile number with the OTP.',
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

      // Check if user exists by mobile or email
      let user = await db.findUserByMobile(identifier);
      if (!user && identifier.includes('@')) {
        user = await db.findUserByEmail(identifier);
      }

      if (!user) {
        return sendError(res, 'Invalid credentials. User not found.', 401);
      }

      const isMatch = await bcrypt.compare(password, user.passwordHash);
      if (!isMatch) {
        return sendError(res, 'Invalid password.', 401);
      }

      const token = generateToken(user.id, user.accountType);

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
   * Request OTP code for mobile verification or login
   */
  static async requestOtp(req: Request, res: Response) {
    try {
      const { mobileNumber } = req.body;
      const cleanMobile = mobileNumber.replace(/\s+/g, '');

      // In production, integrate SMS Gateway (e.g. Dialog Ideamart, Mobitel, Twilio)
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      db.setOtp(cleanMobile, otpCode, 300); // 5 minutes TTL

      return sendSuccess(
        res,
        {
          mobileNumber: cleanMobile,
          otpCode, // Returned for dev testing convenience
          expiresInSeconds: 300,
        },
        'OTP sent successfully via SMS.'
      );
    } catch (err) {
      console.error('Request OTP error:', err);
      return sendError(res, 'Failed to send OTP.', 500);
    }
  }

  /**
   * Verify OTP code
   */
  static async verifyOtp(req: Request, res: Response) {
    try {
      const { mobileNumber, code } = req.body;
      const cleanMobile = mobileNumber.replace(/\s+/g, '');

      const isValid = db.verifyOtp(cleanMobile, code);
      if (!isValid) {
        return sendError(res, 'Invalid or expired OTP code.', 400);
      }

      // Mark user as verified if exists
      const user = await db.findUserByMobile(cleanMobile);
      if (user) {
        await db.updateUser(user.id, { isVerified: true });
      }

      return sendSuccess(
        res,
        { verified: true },
        'OTP verification successful!'
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
      const { mobileNumber, code, newPassword } = req.body;
      const cleanMobile = mobileNumber.replace(/\s+/g, '');

      const isValid = db.verifyOtp(cleanMobile, code);
      if (!isValid) {
        return sendError(res, 'Invalid or expired verification code.', 400);
      }

      const user = await db.findUserByMobile(cleanMobile);
      if (!user) {
        return sendError(res, 'Account with this mobile number does not exist.', 404);
      }

      const passwordHash = await bcrypt.hash(newPassword, 10);
      await db.updateUser(user.id, { passwordHash });

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
}
