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
import { ReviewsScreen } from './reviews-screen';
import { SimilarProductsScreen } from './similar-products-screen';
import { CompareProductsScreen } from './compare-products-screen';
import { WishlistScreen } from './wishlist-screen';
import { FarmMapScreen } from './farm-map-screen';
import { FarmerMatchingFlow } from './farmer-matching-flow';
import { ProductScannerFlow } from './product-scanner-flow';

export type BuyerScreenView =
  | 'home'
  | 'categories'
  | 'category-products'
  | 'search'
  | 'product-detail'
  | 'reviews'
  | 'similar-products'
  | 'compare-products'
  | 'wishlist'
  | 'farm-map'
  | 'farmer-matching'
  | 'product-scanner';

export type BuyerTab = 'home' | 'market' | 'farms' | 'wishlist' | 'profile';

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
    } else if (tab === 'farms') {
      setCurrentView('farm-map');
    } else if (tab === 'wishlist') {
      setCurrentView('wishlist');
    }
  };

  // Check if current screen is full-page flow (so we hide bottom bar if needed)
  const isFullScreenView =
    currentView === 'product-detail' ||
    currentView === 'reviews' ||
    currentView === 'compare-products' ||
    currentView === 'farm-map' ||
    currentView === 'farmer-matching' ||
    currentView === 'product-scanner';

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
            onOpenFarmsMap={() => setCurrentView('farm-map')}
            onOpenFarmerMatching={() => setCurrentView('farmer-matching')}
            onOpenProductScanner={() => setCurrentView('product-scanner')}
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
              alert(`Order placed for ${qty} ${prod.unit} of ${prod.title}! Total: Rs. ${(qty * prod.pricePerUnit).toLocaleString()}`);
            }}
            onChatFarmer={(fId) => {
              alert(`Starting direct chat with farmer #${fId}`);
            }}
            onOpenReviews={() => setCurrentView('reviews')}
            onOpenSimilar={() => setCurrentView('similar-products')}
            onOpenCompare={() => setCurrentView('compare-products')}
            onOpenFarmMap={() => setCurrentView('farm-map')}
            onOpenWishlist={() => setCurrentView('wishlist')}
          />
        )}

        {currentView === 'reviews' && selectedProduct && (
          <ReviewsScreen
            product={selectedProduct}
            onBack={() => setCurrentView('product-detail')}
          />
        )}

        {currentView === 'similar-products' && (
          <SimilarProductsScreen
            baseProduct={selectedProduct}
            onBack={() => setCurrentView('product-detail')}
            onSelectProduct={handleSelectProduct}
            onOpenCompare={() => setCurrentView('compare-products')}
            onToggleWishlist={() => {}}
          />
        )}

        {currentView === 'compare-products' && (
          <CompareProductsScreen
            initialProduct={selectedProduct}
            onBack={() => setCurrentView('product-detail')}
            onSelectProduct={(compItem) => {
              alert(`Selected ${compItem.title} for ordering`);
            }}
            onOrderProduct={(compItem) => {
              alert(`Ordering ${compItem.title} at Rs. ${compItem.pricePerUnit}/${compItem.unit}`);
            }}
          />
        )}

        {currentView === 'wishlist' && (
          <WishlistScreen
            onBack={() => setCurrentView('home')}
            onAddToCart={(item) => {
              alert(`Added ${item.title} to cart`);
            }}
          />
        )}

        {currentView === 'farm-map' && (
          <FarmMapScreen
            onBack={() => setCurrentView('home')}
            onChatFarmer={(phone) => {
              alert(`Starting chat with farmer at ${phone}`);
            }}
            onOpenFarmerMatching={() => setCurrentView('farmer-matching')}
          />
        )}

        {currentView === 'farmer-matching' && (
          <FarmerMatchingFlow
            onBack={() => setCurrentView('home')}
            onOrderFarmer={(farmer) => {
              alert(`Order confirmed with ${farmer.name}!`);
            }}
            onChatFarmer={(fId) => {
              alert(`Opening direct chat with ${fId}`);
            }}
          />
        )}

        {currentView === 'product-scanner' && (
          <ProductScannerFlow
            onBack={() => setCurrentView('home')}
            onExploreMatchingFarmers={(_crop) => {
              setCurrentView('farmer-matching');
            }}
          />
        )}
      </View>

      {/* Persistent Bottom Tab Bar (Matching Figma bottom bar) */}
      {!isFullScreenView && (
        <View style={styles.bottomTabBar}>
          {/* 1. Home */}
          <Pressable
            style={styles.tabBtn}
            onPress={() => handleTabPress('home')}>
            <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={activeTab === 'home' ? '#2E7D32' : '#94A3B8'} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
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
            <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={activeTab === 'market' ? '#2E7D32' : '#94A3B8'} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
              <Path d="M4 6h16M4 12h16M4 18h7" />
              <Path d="M17 15l3 3-3 3" />
            </Svg>
            <Text style={[styles.tabLabel, activeTab === 'market' && styles.tabLabelActive]}>
              Market
            </Text>
          </Pressable>

          {/* 3. Farms / Map */}
          <Pressable
            style={styles.tabBtn}
            onPress={() => handleTabPress('farms')}>
            <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={activeTab === 'farms' ? '#2E7D32' : '#94A3B8'} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
              <Path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
              <Path d="M12 11a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" />
            </Svg>
            <Text style={[styles.tabLabel, activeTab === 'farms' && styles.tabLabelActive]}>
              Farms
            </Text>
          </Pressable>

          {/* 4. Wishlist */}
          <Pressable
            style={styles.tabBtn}
            onPress={() => handleTabPress('wishlist')}>
            <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={activeTab === 'wishlist' ? '#2E7D32' : '#94A3B8'} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
              <Path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </Svg>
            <Text style={[styles.tabLabel, activeTab === 'wishlist' && styles.tabLabelActive]}>
              Wishlist
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
            <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={activeTab === 'profile' ? '#2E7D32' : '#94A3B8'} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
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
    color: '#2E7D32',
    fontWeight: '800',
  },
});
