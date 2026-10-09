import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type SupportedLanguage = 'en' | 'si' | 'ta';

export interface LanguageInfo {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
  sublabel: string;
}

export const LANGUAGES: LanguageInfo[] = [
  { code: 'en', name: 'English', nativeName: 'English', sublabel: 'Default Language' },
  { code: 'si', name: 'Sinhala', nativeName: 'සිංහල', sublabel: 'දේශීය භාෂාව' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', sublabel: 'உள்ளூர் மொழி' },
];

const STORAGE_KEY = 'famora_language_preference';
export const DEFAULT_LANGUAGE: SupportedLanguage = 'en';

export const TRANSLATIONS: Record<SupportedLanguage, Record<string, string>> = {
  en: {
    // General & Actions
    appName: 'Farmora',
    tagline: 'Farm-to-Market Platform',
    continue: 'Continue',
    cancel: 'Cancel',
    save: 'Save',
    edit: 'Edit',
    delete: 'Delete',
    back: 'Back',
    submit: 'Submit',
    confirm: 'Confirm',
    done: 'Done',
    close: 'Close',
    search: 'Search produce, farms, markets...',
    loading: 'Loading...',
    retry: 'Try Again',
    seeAll: 'See All',
    viewDetails: 'View Details',
    addNew: '+ Add New',
    success: 'Success',
    error: 'Error',

    // Language selection
    selectLanguage: 'Choose Your Language',
    languageSubtitle: 'Select your preferred display language',
    languageNotice: 'You can change your language anytime in Settings',
    english: 'English',
    sinhala: 'සිංහල (Sinhala)',
    tamil: 'தமிழ் (Tamil)',

    // Auth
    login: 'Log In',
    register: 'Create Account',
    signUp: 'Sign Up',
    welcomeBack: 'Welcome Back',
    loginSubtitle: 'Log in to connect directly with farmers and buyers',
    mobileNumber: 'Mobile Number',
    email: 'Email Address',
    password: 'Password',
    newPassword: 'New Password',
    confirmPassword: 'Confirm Password',
    forgotPassword: 'Forgot Password?',
    resetPassword: 'Reset Password',
    sendVerificationCode: 'Send Verification Code',
    enterOtp: 'Enter Verification Code',
    verifyCode: 'Verify Code',
    resendCode: 'Resend Code',
    dontHaveAccount: "Don't have an account?",
    alreadyHaveAccount: 'Already have an account?',
    backToLogin: 'Back to Login',
    logout: 'Log Out',

    // Navigation & Tabs
    home: 'Home',
    marketplace: 'Marketplace',
    dashboard: 'Dashboard',
    orders: 'Orders',
    profile: 'Profile',
    chat: 'Messages',
    notifications: 'Notifications',
    settings: 'Settings',
    auctions: 'Live Auctions',
    harvestCalendar: 'Harvest Calendar',
    myProducts: 'My Products',
    cart: 'Cart',

    // Marketplace & Categories
    allCategories: 'All',
    vegetables: 'Vegetables',
    fruits: 'Fruits',
    spices: 'Spices',
    grains: 'Grains',
    herbs: 'Herbs & Leaves',
    organic: '100% Organic',
    conventional: 'Conventional',
    freshHarvest: 'Fresh Harvest',
    inStock: 'In Stock',
    outOfStock: 'Out of Stock',
    price: 'Price',
    perUnit: 'per',
    availableStock: 'Available Stock',
    minOrder: 'Min. Order',
    buyNow: 'Buy Now',
    addToCart: 'Add to Cart',
    placeBid: 'Place Bid',

    // Farmer Flow
    farmerDashboard: 'Farmer Dashboard',
    totalSales: 'Total Sales',
    activeListings: 'Active Listings',
    pendingOrders: 'Pending Orders',
    addProduct: 'Add Product',
    editProduct: 'Edit Product',
    productTitle: 'Product Title',
    category: 'Category',
    description: 'Description',
    pricePerUnit: 'Base Price',
    availableQuantity: 'Available Quantity',
    harvestDate: 'Harvest Date',
    expectedShelfLife: 'Expected Shelf Life',
    qualityGrade: 'Quality Grade',
    farmLocation: 'Farm Location',
    pickupAvailable: 'Farm Gate Pickup',
    directDelivery: 'Direct Delivery',
    publishProduct: 'Publish Product Listing',

    // Orders & Payment
    orderSummary: 'Order Summary',
    paymentMethod: 'Payment Method',
    cardPayment: 'Pay with Card',
    cashOnDelivery: 'Cash on Delivery',
    orderSuccess: 'Order Placed Successfully!',
    deliveryAddress: 'Delivery Address',
    totalAmount: 'Total Amount',
  },

  si: {
    // General & Actions
    appName: 'ෆාමෝරා',
    tagline: 'ගොවිපලෙන් වෙළඳපොළට',
    continue: 'ඉදිරියට යන්න',
    cancel: 'අවලංගු කරන්න',
    save: 'සුරකින්න',
    edit: 'සංස්කරණය',
    delete: 'මකන්න',
    back: 'ආපසු',
    submit: 'ඉදිරිපත් කරන්න',
    confirm: 'තහවුරු කරන්න',
    done: 'අවසන්',
    close: 'වසන්න',
    search: 'එළවළු, පළතුරු, ගොවිපලවල් සොයන්න...',
    loading: 'පූරණය වෙමින්...',
    retry: 'නැවත උත්සාහ කරන්න',
    seeAll: 'සියල්ල බලන්න',
    viewDetails: 'විස්තර බලන්න',
    addNew: '+ අලුතින් එක් කරන්න',
    success: 'සාර්ථකයි',
    error: 'දෝෂයකි',

    // Language selection
    selectLanguage: 'ඔබේ භාෂාව තෝරන්න',
    languageSubtitle: 'යෙදුම භාවිතයට කැමති භාෂාව තෝරන්න',
    languageNotice: 'ඕනෑම වේලාවක සැකසුම් (Settings) තුළින් භාෂාව මාරු කළ හැක',
    english: 'English (ඉංග්‍රීසි)',
    sinhala: 'සිංහල',
    tamil: 'தமிழ் (දෙමළ)',

    // Auth
    login: 'ඇතුල් වන්න',
    register: 'ගිණුමක් සාදන්න',
    signUp: 'ලියාපදිංචි වන්න',
    welcomeBack: 'නැවතත් සාදරයෙන් පිළිගනිමු',
    loginSubtitle: 'ගොවීන් සහ ගැනුම්කරුවන් සමග සෘජුව සම්බන්ධ වන්න',
    mobileNumber: 'දුරකථන අංකය',
    email: 'විද්‍යුත් තැපෑල',
    password: 'මුරපදය',
    newPassword: 'නව මුරපදය',
    confirmPassword: 'නව මුරපදය තහවුරු කරන්න',
    forgotPassword: 'මුරපදය අමතක වුණාද?',
    resetPassword: 'මුරපදය යළි සකසන්න',
    sendVerificationCode: 'තහවුරු කිරීමේ කේතය එවන්න',
    enterOtp: 'කේතය ඇතුළත් කරන්න',
    verifyCode: 'කේතය තහවුරු කරන්න',
    resendCode: 'නැවත එවන්න',
    dontHaveAccount: 'ගිණුමක් නැද්ද?',
    alreadyHaveAccount: 'දැනටමත් ගිණුමක් තිබේද?',
    backToLogin: 'ආපසු ඇතුල් වීමට',
    logout: 'පිටවන්න',

    // Navigation & Tabs
    home: 'මුල් පිටුව',
    marketplace: 'වෙළඳපොළ',
    dashboard: 'පාලක පුවරුව',
    orders: 'ඇණවුම්',
    profile: 'පැතිකඩ',
    chat: 'පණිවිඩ',
    notifications: 'දැනුම්දීම්',
    settings: 'සැකසුම්',
    auctions: 'සජීවී වෙන්දේසි',
    harvestCalendar: 'අස්වනු දිනදර්ශනය',
    myProducts: 'මගේ නිෂ්පාදන',
    cart: 'කරත්තය',

    // Marketplace & Categories
    allCategories: 'සියල්ල',
    vegetables: 'එළවළු',
    fruits: 'පළතුරු',
    spices: 'කුළුබඩු',
    grains: 'ධාන්‍ය',
    herbs: 'කොළ සහ පැළෑටි',
    organic: '100% කාබනික',
    conventional: 'සාම්ප්‍රදායික',
    freshHarvest: 'නැවුම් අස්වැන්න',
    inStock: 'තොග ඇත',
    outOfStock: 'තොග අවසන්',
    price: 'මිල',
    perUnit: 'එකක්',
    availableStock: 'ලබාගත හැකි තොගය',
    minOrder: 'අවම ඇණවුම',
    buyNow: 'දැන් මිලදී ගන්න',
    addToCart: 'කරත්තයට එක් කරන්න',
    placeBid: 'මිල යෝජනා කරන්න',

    // Farmer Flow
    farmerDashboard: 'ගොවි පුවරුව',
    totalSales: 'මුළු ආදායම',
    activeListings: 'ක්‍රියාකාරී තොග',
    pendingOrders: 'පොරොත්තු ඇණවුම්',
    addProduct: 'නිෂ්පාදනයක් එක් කරන්න',
    editProduct: 'නිෂ්පාදනය සංස්කරණය',
    productTitle: 'නිෂ්පාදනයේ නම',
    category: 'වර්ගය',
    description: 'විස්තරය',
    pricePerUnit: 'ඒකකයක මිල',
    availableQuantity: 'පවතින ප්‍රමාණය',
    harvestDate: 'අස්වනු නෙළූ දිනය',
    expectedShelfLife: 'කල් තබාගත හැකි කාලය',
    qualityGrade: 'තත්ත්ව ශ්‍රේණිය',
    farmLocation: 'ගොවිපල පිහිටීම',
    pickupAvailable: 'ගොවිපලෙන්ම රැගෙන යාම',
    directDelivery: 'සෘජු බෙදාහැරීම',
    publishProduct: 'වෙළඳපොළට එක් කරන්න',

    // Orders & Payment
    orderSummary: 'ඇණවුම් සාරාංශය',
    paymentMethod: 'ගෙවීම් ක්‍රමය',
    cardPayment: 'කාඩ්පතෙන් ගෙවන්න',
    cashOnDelivery: 'භාණ්ඩ ලැබුණු පසු ගෙවන්න',
    orderSuccess: 'ඇණවුම සාර්ථකව සම්පූර්ණ විය!',
    deliveryAddress: 'බෙදාහැරීමේ ලිපිනය',
    totalAmount: 'මුළු මුදල',
  },

  ta: {
    // General & Actions
    appName: 'பார்மோரா',
    tagline: 'பண்ணையிலிருந்து சந்தைக்கு',
    continue: 'தொடரவும்',
    cancel: 'ரத்து செய்',
    save: 'சேமிக்க',
    edit: 'திருத்த',
    delete: 'அழிக்க',
    back: 'பின்னால்',
    submit: 'சமர்ப்பிக்க',
    confirm: 'உறுதி செய்',
    done: 'முடிந்தது',
    close: 'மூடு',
    search: 'காய்கறிகள், பண்ணைகள் தேடுக...',
    loading: 'ஏற்றுகிறது...',
    retry: 'மீண்டும் முயற்சிக்கவும்',
    seeAll: 'அனைத்தையும் பார்',
    viewDetails: 'விவரங்களை காண்க',
    addNew: '+ புதியதைச் சேர்',
    success: 'வெற்றி',
    error: 'பிழை',

    // Language selection
    selectLanguage: 'உங்கள் மொழியைத் தேர்வுசெய்க',
    languageSubtitle: 'பயன்படுத்த விரும்பும் மொழியைத் தேர்ந்தெடுக்கவும்',
    languageNotice: 'அமைப்புகளில் (Settings) எப்போது வேண்டுமானாலும் மாற்றலாம்',
    english: 'English (ஆங்கிலம்)',
    sinhala: 'සිංහල (சிங்களம்)',
    tamil: 'தமிழ்',

    // Auth
    login: 'உள்நுழைக',
    register: 'கணக்கு உருவாக்குக',
    signUp: 'பதிவு செய்க',
    welcomeBack: 'மீண்டும் வருக',
    loginSubtitle: 'விவசாயிகள் மற்றும் வாங்குபவர்களுடன் நேரடியாக இணையுங்கள்',
    mobileNumber: 'கைபேசி எண்',
    email: 'மின்னஞ்சல் முகவரி',
    password: 'கடவுச்சொல்',
    newPassword: 'புதிய கடவுச்சொல்',
    confirmPassword: 'கடவுச்சொல்லை உறுதிப்படுத்துக',
    forgotPassword: 'கடவுச்சொல் மறந்துவிட்டதா?',
    resetPassword: 'கடவுச்சொல்லை மாற்றவும்',
    sendVerificationCode: 'சரிபார்ப்புக் குறியீட்டை அனுப்புக',
    enterOtp: 'குறியீட்டை உள்ளிடவும்',
    verifyCode: 'குறியீட்டைச் சரிபார்க்கவும்',
    resendCode: 'மீண்டும் அனுப்புக',
    dontHaveAccount: 'கணக்கு இல்லையா?',
    alreadyHaveAccount: 'ஏற்கனவே கணக்கு உள்ளதா?',
    backToLogin: 'உள்நுழைவுக்குத் திரும்பு',
    logout: 'வெளியேறுக',

    // Navigation & Tabs
    home: 'முகப்பு',
    marketplace: 'சந்தை',
    dashboard: 'கட்டுப்பாட்டகம்',
    orders: 'ஆர்டர்கள்',
    profile: 'சுயவிவரம்',
    chat: 'செய்திகள்',
    notifications: 'அறிவிப்புகள்',
    settings: 'அமைப்புகள்',
    auctions: 'நேரலை ஏலம்',
    harvestCalendar: 'அறுவடை நாட்காட்டி',
    myProducts: 'என் பொருட்கள்',
    cart: 'கூடை',

    // Marketplace & Categories
    allCategories: 'அனைத்தும்',
    vegetables: 'காய்கறிகள்',
    fruits: 'பழங்கள்',
    spices: 'மசாலா பொருட்கள்',
    grains: 'தானியங்கள்',
    herbs: 'மூலிகைகள் மற்றும் இலைகள்',
    organic: '100% இயற்கை',
    conventional: 'வழக்கமான',
    freshHarvest: 'புதிய அறுவடை',
    inStock: 'கையிருப்பில் உள்ளது',
    outOfStock: 'கையிருப்பில் இல்லை',
    price: 'விலை',
    perUnit: 'ஒரு',
    availableStock: 'கிடைக்கக்கூடிய இருப்பு',
    minOrder: 'குறைந்தபட்ச ஆர்டர்',
    buyNow: 'இப்போதே வாங்குக',
    addToCart: 'கூடையில் சேர்க்க',
    placeBid: 'ஏலம் கேட்க',

    // Farmer Flow
    farmerDashboard: 'விவசாயி பலகை',
    totalSales: 'மொத்த விற்பனை',
    activeListings: 'செயலில் உள்ள பட்டியல்',
    pendingOrders: 'நிலுவையில் உள்ளவை',
    addProduct: 'பொருளைச் சேர்',
    editProduct: 'பொருளைத் திருத்து',
    productTitle: 'பொருளின் பெயர்',
    category: 'வகை',
    description: 'விளக்கம்',
    pricePerUnit: 'அடிப்படை விலை',
    availableQuantity: 'கிடைக்கும் அளவு',
    harvestDate: 'அறுவடை தேதி',
    expectedShelfLife: 'சேமிப்புக் காலம்',
    qualityGrade: 'தர நிலை',
    farmLocation: 'பண்ணை அமைவிடம்',
    pickupAvailable: 'பண்ணையிலேயே பெறலாம்',
    directDelivery: 'நேரடி விநியோகம்',
    publishProduct: 'சந்தையில் வெளியிடுக',

    // Orders & Payment
    orderSummary: 'ஆர்டர் சுருக்கம்',
    paymentMethod: 'பணம் செலுத்தும் முறை',
    cardPayment: 'அட்டை மூலம் பணம்',
    cashOnDelivery: 'பொருள் கிடைத்ததும் பணம்',
    orderSuccess: 'ஆர்டர் வெற்றிகரமாக முடிந்தது!',
    deliveryAddress: 'விநியோக முகவரி',
    totalAmount: 'மொத்தத் தொகை',
  },
};

interface LanguageContextType {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => Promise<void>;
  t: (key: string, fallback?: string) => string;
  languages: LanguageInfo[];
}

const LanguageContext = createContext<LanguageContextType>({
  language: DEFAULT_LANGUAGE,
  setLanguage: async () => {},
  t: (key, fallback) => fallback || key,
  languages: LANGUAGES,
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  // Default is strictly English ('en')
  const [language, setLanguageState] = useState<SupportedLanguage>(DEFAULT_LANGUAGE);

  useEffect(() => {
    // Restore user preferred language from storage if previously chosen
    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (stored === 'en' || stored === 'si' || stored === 'ta') {
          setLanguageState(stored);
        } else {
          setLanguageState(DEFAULT_LANGUAGE);
        }
      })
      .catch(() => {
        setLanguageState(DEFAULT_LANGUAGE);
      });
  }, []);

  const setLanguage = async (newLang: SupportedLanguage) => {
    setLanguageState(newLang);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, newLang);
    } catch (e) {
      console.warn('[LanguageProvider] Failed to persist language:', e);
    }
  };

  const t = (key: string, fallback?: string): string => {
    const dict = TRANSLATIONS[language] || TRANSLATIONS.en;
    if (dict[key]) return dict[key];
    const enDict = TRANSLATIONS.en;
    if (enDict[key]) return enDict[key];
    return fallback !== undefined ? fallback : key;
  };

  return React.createElement(
    LanguageContext.Provider,
    { value: { language, setLanguage, t, languages: LANGUAGES } },
    children
  );
}

export function useLanguage(): LanguageContextType {
  return useContext(LanguageContext);
}

// Standalone translation function for utility modules
export function translate(key: string, lang: SupportedLanguage = DEFAULT_LANGUAGE, fallback?: string): string {
  const dict = TRANSLATIONS[lang] || TRANSLATIONS.en;
  return dict[key] || TRANSLATIONS.en[key] || fallback || key;
}
