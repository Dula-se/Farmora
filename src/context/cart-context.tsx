import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface CartItem {
  id: string; // produceId or unique item id
  title: string;
  pricePerUnit: number;
  unit: string;
  farmerName: string;
  locationCity?: string;
  locationDistrict?: string;
  image: string;
  quantity: number;
  maxQuantity?: number;
  category?: string;
  isOrganic?: boolean;
}

interface CartContextType {
  items: CartItem[];
  totalCount: number; // total quantity of items
  distinctCount: number; // number of distinct products
  subtotal: number;
  deliveryFee: number;
  discount: number;
  totalAmount: number;
  addToCart: (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, delta: number) => void;
  setQuantity: (id: string, qty: number) => void;
  clearCart: () => void;
  isInCart: (id: string) => boolean;
  getItemQuantity: (id: string) => number;
}

const CART_STORAGE_KEY = '@famora_cart_items_v1';

// Initial sample items so buyer cart is not completely empty on first test if desired,
// but empty if cleared by user
const INITIAL_DEMO_ITEMS: CartItem[] = [
  {
    id: 'demo-cart-1',
    title: 'Organic Red Tomatoes',
    pricePerUnit: 240,
    unit: 'kg',
    farmerName: 'Perera Organic Farm',
    locationCity: 'Kandy',
    locationDistrict: 'Kandy',
    image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=500&auto=format&fit=crop&q=80',
    quantity: 2,
    maxQuantity: 50,
    category: 'Vegetables',
    isOrganic: true,
  },
  {
    id: 'demo-cart-2',
    title: 'Fresh Keeramin Carrots',
    pricePerUnit: 280,
    unit: 'kg',
    farmerName: 'Highland Fresh Fields',
    locationCity: 'Nuwara Eliya',
    locationDistrict: 'Nuwara Eliya',
    image: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=500&auto=format&fit=crop&q=80',
    quantity: 1,
    maxQuantity: 30,
    category: 'Vegetables',
    isOrganic: true,
  },
];

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(INITIAL_DEMO_ITEMS);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from AsyncStorage on mount
  useEffect(() => {
    const loadSavedCart = async () => {
      try {
        const json = await AsyncStorage.getItem(CART_STORAGE_KEY);
        if (json) {
          const parsed = JSON.parse(json);
          if (Array.isArray(parsed)) {
            setItems(parsed);
          }
        }
      } catch (e) {
        console.warn('[CartProvider] Failed to load cart from AsyncStorage', e);
      } finally {
        setIsLoaded(true);
      }
    };
    loadSavedCart();
  }, []);

  // Save to AsyncStorage whenever items change (after initial load)
  useEffect(() => {
    if (!isLoaded) return;
    AsyncStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items)).catch((err) => {
      console.warn('[CartProvider] Failed to persist cart', err);
    });
  }, [items, isLoaded]);

  const addToCart = useCallback((product: Omit<CartItem, 'quantity'> & { quantity?: number }) => {
    const addQty = product.quantity && product.quantity > 0 ? product.quantity : 1;
    setItems((prev) => {
      const existingIdx = prev.findIndex((item) => item.id === product.id);
      if (existingIdx > -1) {
        const copy = [...prev];
        const existing = copy[existingIdx];
        const maxQ = existing.maxQuantity || 999;
        const newQty = Math.min(existing.quantity + addQty, maxQ);
        copy[existingIdx] = { ...existing, quantity: newQty };
        return copy;
      } else {
        return [
          ...prev,
          {
            ...product,
            quantity: addQty,
          },
        ];
      }
    });
  }, []);

  const removeFromCart = useCallback((id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const updateQuantity = useCallback((id: string, delta: number) => {
    setItems((prev) => {
      return prev
        .map((item) => {
          if (item.id === id) {
            const newQty = item.quantity + delta;
            const maxQ = item.maxQuantity || 999;
            return { ...item, quantity: Math.min(newQty, maxQ) };
          }
          return item;
        })
        .filter((item) => item.quantity > 0);
    });
  }, []);

  const setQuantity = useCallback((id: string, qty: number) => {
    setItems((prev) => {
      if (qty <= 0) {
        return prev.filter((item) => item.id !== id);
      }
      return prev.map((item) => {
        if (item.id === id) {
          const maxQ = item.maxQuantity || 999;
          return { ...item, quantity: Math.min(qty, maxQ) };
        }
        return item;
      });
    });
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const isInCart = useCallback(
    (id: string) => {
      return items.some((item) => item.id === id);
    },
    [items]
  );

  const getItemQuantity = useCallback(
    (id: string) => {
      const found = items.find((item) => item.id === id);
      return found ? found.quantity : 0;
    },
    [items]
  );

  const totalCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const distinctCount = items.length;
  const subtotal = items.reduce((sum, item) => sum + item.pricePerUnit * item.quantity, 0);
  const deliveryFee = items.length > 0 ? (subtotal > 2000 ? 0 : 250) : 0;
  const discount = items.length > 0 ? (subtotal > 1500 ? 100 : 0) : 0;
  const totalAmount = Math.max(0, subtotal + deliveryFee - discount);

  return (
    <CartContext.Provider
      value={{
        items,
        totalCount,
        distinctCount,
        subtotal,
        deliveryFee,
        discount,
        totalAmount,
        addToCart,
        removeFromCart,
        updateQuantity,
        setQuantity,
        clearCart,
        isInCart,
        getItemQuantity,
      }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
