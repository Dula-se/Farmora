import React, { useState } from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { ApiProduceItem } from '@/services/api';
import { BuyerHomeScreen } from './buyer-home-screen';
import { AllCategoriesScreen } from './all-categories-screen';
import { CategoryProductsScreen } from './category-products-screen';
import { SearchScreen } from './search-screen';
import { ProductDetailScreen } from './product-detail-screen';

export type BuyerScreenView =
  | 'home'
  | 'categories'
  | 'category-products'
  | 'search'
  | 'product-detail';

export type BuyerTab = 'home' | 'market' | 'orders' | 'chats' | 'profile';

interface MarketplaceFlowProps {
  onBackToAuth?: () => void;
}

export function MarketplaceFlow({ onBackToAuth }: MarketplaceFlowProps) {
  const [currentView, setCurrentView] = useState<BuyerScreenView>('home');
  const [activeTab, setActiveTab] = useState<BuyerTab>('home');
  const [selectedCategory, setSelectedCategory] = useState({ id: 'vegetables', name: 'Vegetables' });
  const [selectedProduct, setSelectedProduct] = useState<ApiProduceItem | null>(null);

  const handleSelectCategory = (id: string, name: string) => {
    setSelectedCategory({ id, name });
    setCurrentView('category-products');
  };

  const handleSelectProduct = (product: ApiProduceItem) => {
    setSelectedProduct(product);
    setCurrentView('product-detail');
  };

  const handleTabPress = (tab: BuyerTab) => {
    setActiveTab(tab);
    if (tab === 'home') {
      setCurrentView('home');
    } else if (tab === 'market') {
      setCurrentView('categories');
    }
  };

  return (
    <View style={styles.container}>
      {/* Active Screen View */}
      <View style={styles.screenContainer}>
        {currentView === 'home' && (
          <BuyerHomeScreen
            onOpenSearch={() => setCurrentView('search')}
            onOpenCategories={() => setCurrentView('categories')}
            onSelectCategory={handleSelectCategory}
            onSelectProduct={handleSelectProduct}
          />
        )}

        {currentView === 'categories' && (
          <AllCategoriesScreen
            onBack={() => setCurrentView('home')}
            onSelectCategory={handleSelectCategory}
          />
        )}

        {currentView === 'category-products' && (
          <CategoryProductsScreen
            categoryId={selectedCategory.id}
            categoryName={selectedCategory.name}
            onBack={() => setCurrentView('categories')}
            onSelectProduct={handleSelectProduct}
            onExploreAll={() => setCurrentView('categories')}
          />
        )}

        {currentView === 'search' && (
          <SearchScreen
            onBack={() => setCurrentView('home')}
            onSelectProduct={handleSelectProduct}
            onSelectCategory={(catId) => handleSelectCategory(catId, catId)}
          />
        )}

        {currentView === 'product-detail' && selectedProduct && (
          <ProductDetailScreen
            product={selectedProduct}
            onBack={() => setCurrentView('home')}
            onOrderNow={(prod, qty) => {
              alert(`Order confirmed for ${qty} ${prod.unit} of ${prod.title}! Total: Rs. ${(qty * prod.pricePerUnit).toLocaleString()}`);
            }}
            onChatFarmer={(fId) => {
              alert(`Starting direct chat with farmer #${fId}`);
            }}
          />
        )}
      </View>

      {/* Persistent Bottom Tab Bar (Matching Figma bottom bar) */}
      {currentView !== 'product-detail' && (
        <View style={styles.bottomTabBar}>
          {/* 1. Home */}
          <Pressable
            style={styles.tabBtn}
            onPress={() => handleTabPress('home')}>
            <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={activeTab === 'home' ? '#386641' : '#94A3B8'} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
              <Path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <Path d="M9 22V12h6v10" />
            </Svg>
            <Text style={[styles.tabLabel, activeTab === 'home' && styles.tabLabelActive]}>
              Home
            </Text>
          </Pressable>

          {/* 2. Market / Explore */}
          <Pressable
            style={styles.tabBtn}
            onPress={() => handleTabPress('market')}>
            <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={activeTab === 'market' ? '#386641' : '#94A3B8'} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
              <Path d="M4 6h16M4 12h16M4 18h7" />
              <Path d="M17 15l3 3-3 3" />
            </Svg>
            <Text style={[styles.tabLabel, activeTab === 'market' && styles.tabLabelActive]}>
              Market
            </Text>
          </Pressable>

          {/* 3. Orders */}
          <Pressable
            style={styles.tabBtn}
            onPress={() => handleTabPress('orders')}>
            <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={activeTab === 'orders' ? '#386641' : '#94A3B8'} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
              <Path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
              <Path d="M3 6h18" />
              <Path d="M16 10a4 4 0 0 1-8 0" />
            </Svg>
            <Text style={[styles.tabLabel, activeTab === 'orders' && styles.tabLabelActive]}>
              Orders
            </Text>
          </Pressable>

          {/* 4. Chats */}
          <Pressable
            style={styles.tabBtn}
            onPress={() => handleTabPress('chats')}>
            <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={activeTab === 'chats' ? '#386641' : '#94A3B8'} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
              <Path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </Svg>
            <Text style={[styles.tabLabel, activeTab === 'chats' && styles.tabLabelActive]}>
              Chats
            </Text>
          </Pressable>

          {/* 5. Profile / Auth switcher */}
          <Pressable
            style={styles.tabBtn}
            onPress={() => {
              if (onBackToAuth) {
                onBackToAuth();
              } else {
                handleTabPress('profile');
              }
            }}>
            <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={activeTab === 'profile' ? '#386641' : '#94A3B8'} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
              <Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <Path d="M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" />
            </Svg>
            <Text style={[styles.tabLabel, activeTab === 'profile' && styles.tabLabelActive]}>
              Profile
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  screenContainer: {
    flex: 1,
  },
  bottomTabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingVertical: 8,
    paddingBottom: Platform.OS === 'ios' ? 24 : 10,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 8,
  },
  tabBtn: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
  },
  tabLabel: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
  },
  tabLabelActive: {
    color: '#386641',
    fontWeight: '800',
  },
});
