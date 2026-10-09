process.env.NODE_ENV = 'test';
import test, { describe, it } from 'node:test';
import assert from 'node:assert';
import jwt from 'jsonwebtoken';

describe('Auth & Password Reset Validation Rules', () => {
  // Sri Lankan Phone Number RegEx (supporting +94 or 0 prefix)
  const phoneRegex = /^(?:\+94|0)?7[0-9]{8}$/;

  // Standard Email RegEx
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // 6-digit OTP RegEx
  const otpRegex = /^\d{6}$/;

  describe('Contact Identifier Validation', () => {
    it('should correctly accept valid Sri Lankan mobile numbers', () => {
      const validNumbers = [
        '+94771234567',
        '+94712345678',
        '+94769876543',
        '0771234567',
        '0712345678',
        '771234567',
      ];
      for (const num of validNumbers) {
        assert.ok(phoneRegex.test(num.replace(/\s+/g, '')), `Failed for ${num}`);
      }
    });

    it('should reject invalid phone numbers', () => {
      const invalidNumbers = [
        '12345',
        '+14155552671', // US number
        '0112345678',   // Landline, not mobile 7x
        'abcd123456',
        '+947712345',   // Too short
        '+9477123456789', // Too long
      ];
      for (const num of invalidNumbers) {
        assert.strictEqual(phoneRegex.test(num), false, `Should reject ${num}`);
      }
    });

    it('should correctly validate email addresses', () => {
      assert.ok(emailRegex.test('farmer@famora.lk'));
      assert.ok(emailRegex.test('user.name+tag@example.com'));
      assert.strictEqual(emailRegex.test('invalid-email'), false);
      assert.strictEqual(emailRegex.test('@missinguser.com'), false);
      assert.strictEqual(emailRegex.test('missingat.com'), false);
    });
  });

  describe('OTP Code Format Validation', () => {
    it('should accept strictly 6 numeric digits', () => {
      assert.ok(otpRegex.test('123456'));
      assert.ok(otpRegex.test('000000'));
      assert.ok(otpRegex.test('987654'));
    });

    it('should reject invalid OTP formats', () => {
      assert.strictEqual(otpRegex.test('12345'), false);   // 5 digits
      assert.strictEqual(otpRegex.test('1234567'), false); // 7 digits
      assert.strictEqual(otpRegex.test('12345a'), false);  // contains character
      assert.strictEqual(otpRegex.test(''), false);
    });
  });

  describe('Password Security Rules', () => {
    const validatePassword = (pwd: string, confirm: string) => {
      if (!pwd || pwd.length < 8) {
        return { valid: false, error: 'Password must be at least 8 characters' };
      }
      if (pwd !== confirm) {
        return { valid: false, error: 'Passwords do not match' };
      }
      return { valid: true };
    };

    it('should validate matching passwords of sufficient length', () => {
      const result = validatePassword('FamoraSecure2026!', 'FamoraSecure2026!');
      assert.strictEqual(result.valid, true);
    });

    it('should reject passwords shorter than 8 characters', () => {
      const result = validatePassword('short1', 'short1');
      assert.strictEqual(result.valid, false);
      assert.ok(result.error?.includes('at least 8'));
    });

    it('should reject non-matching passwords', () => {
      const result = validatePassword('Password123', 'Password456');
      assert.strictEqual(result.valid, false);
      assert.ok(result.error?.includes('do not match'));
    });
  });

  describe('JWT Authentication Tokens', () => {
    const secret = 'famora_test_secret_key_123';

    it('should generate and verify signed JWT with correct payload', () => {
      const payload = { userId: 'usr_abc123', role: 'farmer', email: 'farmer@famora.lk' };
      const token = jwt.sign(payload, secret, { expiresIn: '1h' });

      assert.ok(typeof token === 'string' && token.length > 20);

      const decoded = jwt.verify(token, secret) as typeof payload & { exp: number };
      assert.strictEqual(decoded.userId, payload.userId);
      assert.strictEqual(decoded.role, payload.role);
      assert.strictEqual(decoded.email, payload.email);
    });

    it('should reject tampered JWT tokens', () => {
      const token = jwt.sign({ userId: 'usr_abc123' }, secret, { expiresIn: '1h' });
      const tampered = token.slice(0, -5) + 'xxxxx';

      assert.throws(() => {
        jwt.verify(tampered, secret);
      });
    });
  });
});
