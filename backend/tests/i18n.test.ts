process.env.NODE_ENV = 'test';
import test, { describe, it } from 'node:test';
import assert from 'node:assert';
import { TRANSLATIONS, DEFAULT_LANGUAGE, LANGUAGES, SupportedLanguage } from '../../src/services/i18n.js';

describe('Tri-Lingual Internationalization (i18n) System', () => {
  it('should have English (en) as the strict default language', () => {
    assert.strictEqual(DEFAULT_LANGUAGE, 'en');
  });

  it('should support exactly three languages: English, Sinhala, and Tamil', () => {
    const codes = LANGUAGES.map((l) => l.code);
    assert.deepStrictEqual(codes, ['en', 'si', 'ta']);

    assert.ok(TRANSLATIONS.en, 'English dictionary must exist');
    assert.ok(TRANSLATIONS.si, 'Sinhala dictionary must exist');
    assert.ok(TRANSLATIONS.ta, 'Tamil dictionary must exist');
  });

  it('should have essential common keys defined across English, Sinhala, and Tamil', () => {
    const criticalKeys = [
      'appName',
      'login',
      'register',
      'forgotPassword',
      'settings',
      'marketplace',
      'language',
      'cart',
      'notifications',
    ];

    for (const key of criticalKeys) {
      assert.ok(TRANSLATIONS.en[key], `English is missing key: ${key}`);
      assert.ok(TRANSLATIONS.si[key], `Sinhala is missing key: ${key}`);
      assert.ok(TRANSLATIONS.ta[key], `Tamil is missing key: ${key}`);
    }
  });

  it('should correctly fallback to English when a key is not present in another language', () => {
    const translate = (lang: SupportedLanguage, key: string, fallback?: string): string => {
      const dict = TRANSLATIONS[lang] || TRANSLATIONS.en;
      if (dict && dict[key]) return dict[key];
      if (TRANSLATIONS.en && TRANSLATIONS.en[key]) return TRANSLATIONS.en[key];
      return fallback !== undefined ? fallback : key;
    };

    // Existing key
    assert.strictEqual(translate('en', 'login'), 'Log In');
    assert.strictEqual(translate('si', 'login'), 'ඇතුල් වන්න');
    assert.strictEqual(translate('ta', 'login'), 'உள்நுழைக');

    // Missing key in Sinhala falls back to English if English has it
    const mockDict = { ...TRANSLATIONS };
    delete (mockDict.si as any).customOnlyInEnglish;
    mockDict.en.customOnlyInEnglish = 'Only In English';

    assert.strictEqual(translate('si', 'customOnlyInEnglish'), 'Only In English');

    // Completely unknown key returns fallback
    assert.strictEqual(translate('si', 'completely_unknown_key_xyz', 'Default Fallback'), 'Default Fallback');
  });
});
