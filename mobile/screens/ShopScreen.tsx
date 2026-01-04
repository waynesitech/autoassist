import React, { useState, useMemo, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Image, Alert, ImageBackground, Modal, PanResponder, ActivityIndicator, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Product, CartItem, Workshop, Transaction } from '../types';
import { api } from '../services/api';
import { sessionStorage } from '../services/sessionStorage';
import { WORKSHOP_BANNER_IMAGE } from '../constants';

interface ShopScreenProps {
  cart: CartItem[];
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>;
  addToCart: (p: Product) => void;
  removeFromCart: (id: number) => void;
  isDarkMode: boolean;
  selectedWorkshop: Workshop | null;
  setSelectedWorkshop: (w: Workshop) => void;
  workshops: Workshop[];
  onActionComplete: () => void;
}

const ShopScreen: React.FC<ShopScreenProps> = ({ cart, setCart, addToCart, removeFromCart, isDarkMode, selectedWorkshop, setSelectedWorkshop, workshops, onActionComplete }) => {
  const [search, setSearch] = useState('');
  const [showCart, setShowCart] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [imageScale, setImageScale] = useState(1);
  const [imageTranslate, setImageTranslate] = useState({ x: 0, y: 0 });
  const lastPanRef = useRef({ x: 0, y: 0 });
  const [transactionModalVisible, setTransactionModalVisible] = useState(false);
  const [shopTransactions, setShopTransactions] = useState<Transaction[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const slideAnim = useRef(new Animated.Value(-1000)).current;
  
  // Products state
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [productsError, setProductsError] = useState<string | null>(null);

  // Fetch products from API
  useEffect(() => {
    const loadProducts = async () => {
      setLoadingProducts(true);
      setProductsError(null);
      try {
        const fetchedProducts = await api.getProducts();
        setProducts(fetchedProducts);
      } catch (error: any) {
        console.error('Failed to load products:', error);
        setProductsError(error?.message || 'Failed to load products. Please try again.');
        setProducts([]);
      } finally {
        setLoadingProducts(false);
      }
    };

    loadProducts();
  }, []);

  const filteredProducts = useMemo(() => {
    return products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
  }, [products, search]);

  const total = useMemo(() => {
    return cart.reduce((acc, item) => {
      const price = typeof item.price === 'number' ? item.price : parseFloat(item.price || '0');
      return acc + (price * item.quantity);
    }, 0);
  }, [cart]);

  const panResponder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => imageScale > 1,
    onMoveShouldSetPanResponder: () => imageScale > 1,
    onPanResponderGrant: () => {
      lastPanRef.current = { ...imageTranslate };
    },
    onPanResponderMove: (evt, gestureState) => {
      if (imageScale > 1) {
        setImageTranslate({
          x: lastPanRef.current.x + gestureState.dx,
          y: lastPanRef.current.y + gestureState.dy,
        });
      }
    },
    onPanResponderRelease: () => {
      lastPanRef.current = { ...imageTranslate };
    },
  }), [imageScale, imageTranslate]);

  const handleCheckout = async () => {
    if (!selectedWorkshop) {
      Alert.alert('Error', 'Please select a workshop first');
      return;
    }
    if (cart.length === 0) {
      Alert.alert('Error', 'Your cart is empty');
      return;
    }
    setCheckingOut(true);
    try {
      // Get user from session storage
      const user = await sessionStorage.getUser();
      await api.checkout(cart, selectedWorkshop, total, user?.id || null);
      Alert.alert('Success', 'Order placed successfully! Transaction added to database.');
      setCart([]);
      setShowCart(false);
      onActionComplete();
    } catch (e) {
      Alert.alert('Error', 'Checkout failed. Database error.');
    } finally {
      setCheckingOut(false);
    }
  };

  const handleShowTransactions = async () => {
    setTransactionModalVisible(true);
    setLoadingTransactions(true);
    try {
      const transactions = await api.getTransactions();
      const shopTxs = transactions.filter(t => t.type === 'Shop');
      setShopTransactions(shopTxs);
    } catch (error) {
      Alert.alert('Error', 'Failed to load shop transactions');
      setShopTransactions([]);
    } finally {
      setLoadingTransactions(false);
    }
    // Animate slide from top
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 50,
      friction: 8,
    }).start();
  };

  const handleCloseTransactions = () => {
    Animated.timing(slideAnim, {
      toValue: -1000,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setTransactionModalVisible(false);
    });
  };

  useEffect(() => {
    if (!transactionModalVisible) {
      slideAnim.setValue(-1000);
    }
  }, [transactionModalVisible]);

  if (showCart) {
    return (
      <ScrollView
        style={[styles.container, { backgroundColor: isDarkMode ? '#020617' : '#F5F2F2' }]}
        contentContainerStyle={styles.content}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setShowCart(false)}>
            <Ionicons name="arrow-back" size={24} color={isDarkMode ? '#94a3b8' : '#64748b'} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: isDarkMode ? '#fff' : '#0f172a' }]}>Your Cart</Text>
        </View>

        {cart.length === 0 ? (
          <View style={styles.emptyCart}>
            <Ionicons name="bag-outline" size={64} color={isDarkMode ? 'rgba(148,163,184,0.1)' : 'rgba(100,116,139,0.2)'} />
            <Text style={[styles.emptyCartText, { color: isDarkMode ? '#64748b' : '#94a3b8' }]}>Your cart is empty</Text>
            <TouchableOpacity onPress={() => setShowCart(false)}>
              <Text style={styles.emptyCartButton}>Start Shopping</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.cartItems}>
              {cart.map((item) => (
                <View key={item.id} style={[styles.cartItem, { backgroundColor: isDarkMode ? '#1e293b' : '#fff' }]}>
                  <Image source={{ uri: item.image }} style={styles.cartItemImage} />
                  <View style={styles.cartItemInfo}>
                    <Text style={[styles.cartItemName, { color: isDarkMode ? '#f1f5f9' : '#1e293b' }]}>{item.name}</Text>
                    <Text style={[styles.cartItemQty, { color: isDarkMode ? '#64748b' : '#94a3b8' }]}>Qty: {item.quantity}</Text>
                    <Text style={styles.cartItemPrice}>
                      RM {((typeof item.price === 'number' ? item.price : parseFloat(item.price || '0')) * item.quantity).toFixed(2)}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => removeFromCart(item.id)}>
                    <Ionicons name="trash-outline" size={20} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>

            <View style={[styles.summary, { backgroundColor: isDarkMode ? '#1e293b' : '#fff' }]}>
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: isDarkMode ? '#64748b' : '#94a3b8' }]}>Subtotal</Text>
                <Text style={[styles.summaryValue, { color: isDarkMode ? '#f1f5f9' : '#1e293b' }]}>RM {total.toFixed(2)}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: isDarkMode ? '#64748b' : '#94a3b8' }]}>Fulfillment at</Text>
                <View style={[styles.workshopBadge, { backgroundColor: isDarkMode ? '#0f172a' : '#fef3c7' }]}>
                  <Text style={[styles.workshopBadgeText, { color: isDarkMode ? '#f97316' : '#92400e' }]}>{selectedWorkshop?.name || 'No Workshop'}</Text>
                </View>
              </View>
              <View style={[styles.divider, { backgroundColor: isDarkMode ? '#0f172a' : '#f1f5f9' }]} />
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryTotalLabel, { color: isDarkMode ? '#fff' : '#0f172a' }]}>Total</Text>
                <Text style={styles.summaryTotalValue}>RM {total.toFixed(2)}</Text>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.checkoutButton, { backgroundColor: isDarkMode ? '#f1f5f9' : '#0f172a' }]}
              onPress={handleCheckout}
              disabled={checkingOut || !selectedWorkshop}
            >
              {checkingOut ? (
                <Text style={[styles.checkoutButtonText, { color: isDarkMode ? '#020617' : '#fff' }]}>Processing...</Text>
              ) : (
                <Text style={[styles.checkoutButtonText, { color: isDarkMode ? '#020617' : '#fff' }]}>
                  Confirm Order for {selectedWorkshop?.name || 'Workshop'}
                </Text>
              )}
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: isDarkMode ? '#020617' : '#f8fafc' }]}
      contentContainerStyle={styles.content}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: isDarkMode ? '#fff' : '#0f172a' }]}>Auto Shop</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={[
              styles.transactionButton,
              {
                backgroundColor: isDarkMode ? '#1e293b' : '#fff',
                borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : '#e2e8f0',
              },
            ]}
            onPress={handleShowTransactions}
          >
            <Ionicons name="receipt-outline" size={20} color="#f97316" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.cartButton} onPress={() => setShowCart(true)}>
            <Ionicons name="bag" size={24} color="#fff" />
            {cart.length > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{cart.length}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.workshopSection}>
        <Text style={[styles.label, { color: isDarkMode ? '#475569' : '#64748b' }]}>Nearby Fulfillment Partner</Text>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          style={styles.workshopList}
          contentContainerStyle={styles.workshopListContent}
        >
          {workshops.map((w) => (
            <TouchableOpacity
              key={w.id}
              style={[
                styles.workshopCard,
                {
                  borderColor: selectedWorkshop?.id === w.id ? '#f97316' : (isDarkMode ? 'rgba(255,255,255,0.05)' : '#e2e8f0'),
                  borderWidth: selectedWorkshop?.id === w.id ? 2 : 1,
                },
              ]}
              onPress={() => {
                setSelectedWorkshop(w);
                setImageModalVisible(true);
              }}
            >
              <ImageBackground
                source={
                  w.image 
                    ? { uri: w.image }
                    : (typeof WORKSHOP_BANNER_IMAGE === 'number' ? WORKSHOP_BANNER_IMAGE : { uri: WORKSHOP_BANNER_IMAGE })
                }
                style={styles.workshopCardImageContainer}
                imageStyle={styles.workshopCardImage}
                resizeMode="contain"
              />
              <View style={styles.workshopCardTextBackground}>
                <Text style={[styles.workshopName, { color: '#fff' }]}>{w.name}</Text>
                <Text style={styles.workshopLocation}>{w.location}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={isDarkMode ? '#64748b' : '#94a3b8'} style={styles.searchIcon} />
        <TextInput
          style={[styles.searchInput, { backgroundColor: isDarkMode ? '#1e293b' : '#fff', color: isDarkMode ? '#fff' : '#0f172a' }]}
          placeholder="Search for parts..."
          placeholderTextColor={isDarkMode ? '#64748b' : '#94a3b8'}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {loadingProducts ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#f97316" />
          <Text style={[styles.loadingText, { color: isDarkMode ? '#64748b' : '#94a3b8' }]}>Loading products...</Text>
        </View>
      ) : productsError ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
          <Text style={[styles.errorText, { color: isDarkMode ? '#fca5a5' : '#dc2626' }]}>{productsError}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={async () => {
              setLoadingProducts(true);
              setProductsError(null);
              try {
                const fetchedProducts = await api.getProducts();
                setProducts(fetchedProducts);
              } catch (error: any) {
                console.error('Failed to load products:', error);
                setProductsError(error?.message || 'Failed to load products. Please try again.');
              } finally {
                setLoadingProducts(false);
              }
            }}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : filteredProducts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="search-outline" size={64} color={isDarkMode ? 'rgba(148,163,184,0.1)' : 'rgba(100,116,139,0.2)'} />
          <Text style={[styles.emptyText, { color: isDarkMode ? '#64748b' : '#94a3b8' }]}>
            {search ? 'No products found matching your search' : 'No products available'}
          </Text>
        </View>
      ) : (
        <View style={styles.productsGrid}>
          {filteredProducts.map((p) => (
          <View key={p.id} style={[styles.productCard, { backgroundColor: isDarkMode ? '#1e293b' : '#fff' }]}>
            <View style={styles.productImageContainer}>
              <Image source={{ uri: p.image }} style={styles.productImage} />
              <View style={[styles.stockBadge, { backgroundColor: p.stock > 0 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)' }]}>
                <Text style={[styles.stockBadgeText, { color: p.stock > 0 ? '#10b981' : '#ef4444' }]}>
                  {p.stock > 0 ? 'In Stock' : 'Out'}
                </Text>
              </View>
            </View>
            <Text style={[styles.productCategory, { color: '#f97316' }]}>{p.category}</Text>
            <Text style={[styles.productName, { color: isDarkMode ? '#f1f5f9' : '#1e293b' }]} numberOfLines={2}>
              {p.name}
            </Text>
            <View style={styles.productFooter}>
              <Text style={[styles.productPrice, { color: isDarkMode ? '#fff' : '#0f172a' }]}>
                RM {(typeof p.price === 'number' ? p.price : parseFloat(p.price || '0')).toFixed(2)}
              </Text>
              <TouchableOpacity
                style={[styles.addButton, { backgroundColor: isDarkMode ? '#0f172a' : '#f1f5f9' }]}
                onPress={() => addToCart(p)}
              >
                <Ionicons name="add" size={20} color={isDarkMode ? '#fff' : '#64748b'} />
              </TouchableOpacity>
            </View>
          </View>
        ))}
        </View>
      )}

      <Modal
        visible={imageModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          setImageModalVisible(false);
          setImageScale(1);
          setImageTranslate({ x: 0, y: 0 });
        }}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => {
            setImageModalVisible(false);
            setImageScale(1);
            setImageTranslate({ x: 0, y: 0 });
          }}
        >
          <View style={styles.modalContent}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => {
                setImageModalVisible(false);
                setImageScale(1);
                setImageTranslate({ x: 0, y: 0 });
              }}
            >
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
            <View style={styles.zoomControls}>
              <TouchableOpacity
                style={styles.zoomButton}
                onPress={() => setImageScale(Math.min(3, imageScale + 0.5))}
              >
                <Ionicons name="add" size={24} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.zoomButton}
                onPress={() => setImageScale(Math.max(1, imageScale - 0.5))}
              >
                <Ionicons name="remove" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            <View {...panResponder.panHandlers} style={styles.modalImageContainer}>
              <Image
                source={
                  selectedWorkshop?.image 
                    ? { uri: selectedWorkshop.image }
                    : (typeof WORKSHOP_BANNER_IMAGE === 'number' ? WORKSHOP_BANNER_IMAGE : { uri: WORKSHOP_BANNER_IMAGE })
                }
                style={[
                  styles.modalImage,
                  {
                    transform: [
                      { translateX: imageTranslate.x },
                      { translateY: imageTranslate.y },
                      { scale: imageScale },
                    ],
                  },
                ]}
                resizeMode="contain"
              />
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal
        visible={transactionModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCloseTransactions}
      >
        <View style={styles.indexModalOverlay}>
          <Animated.View
            style={[
              styles.indexModalContent,
              { backgroundColor: isDarkMode ? '#1e293b' : '#fff' },
              {
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <View style={[
              styles.indexModalHeader,
              { borderBottomColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }
            ]}>
              <Text style={[styles.indexModalTitle, { color: isDarkMode ? '#fff' : '#0f172a' }]}>
                Shop Order Transactions
              </Text>
              <TouchableOpacity
                onPress={handleCloseTransactions}
                style={styles.indexModalCloseButton}
              >
                <Ionicons name="close" size={24} color={isDarkMode ? '#fff' : '#0f172a'} />
              </TouchableOpacity>
            </View>
            
            {loadingTransactions ? (
              <View style={styles.indexLoadingContainer}>
                <ActivityIndicator size="large" color="#f97316" />
                <Text style={[styles.indexLoadingText, { color: isDarkMode ? '#64748b' : '#94a3b8' }]}>
                  Loading transactions...
                </Text>
              </View>
            ) : shopTransactions.length === 0 ? (
              <View style={styles.indexEmptyContainer}>
                <Ionicons name="bag-outline" size={64} color={isDarkMode ? 'rgba(148,163,184,0.1)' : 'rgba(100,116,139,0.2)'} />
                <Text style={[styles.indexEmptyText, { color: isDarkMode ? '#64748b' : '#94a3b8' }]}>
                  No shop order transactions found
                </Text>
              </View>
            ) : (
              <ScrollView style={styles.indexMessagesList} showsVerticalScrollIndicator={false}>
                {shopTransactions.map((transaction, index) => (
                  <View
                    key={transaction.id || index}
                    style={[
                      styles.indexMessageCard,
                      { backgroundColor: isDarkMode ? '#0f172a' : '#f1f5f9' },
                    ]}
                  >
                    <View style={styles.indexMessageHeader}>
                      <View style={styles.indexMessageIdContainer}>
                        <Text style={[styles.indexMessageId, { color: isDarkMode ? '#f97316' : '#f97316' }]}>
                          {transaction.id}
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.indexMessageStatus,
                          {
                            backgroundColor:
                              transaction.status === 'completed'
                                ? 'rgba(16, 185, 129, 0.2)'
                                : transaction.status === 'pending'
                                ? 'rgba(249, 115, 22, 0.2)'
                                : transaction.status === 'ongoing'
                                ? 'rgba(59, 130, 246, 0.2)'
                                : 'rgba(239, 68, 68, 0.2)',
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.indexMessageStatusText,
                            {
                              color:
                                transaction.status === 'completed'
                                  ? '#10b981'
                                  : transaction.status === 'pending'
                                  ? '#f97316'
                                  : transaction.status === 'ongoing'
                                  ? '#3b82f6'
                                  : '#ef4444',
                            },
                          ]}
                        >
                          {transaction.status?.toUpperCase()}
                        </Text>
                      </View>
                    </View>
                    <Text style={[styles.indexMessageTitle, { color: isDarkMode ? '#f1f5f9' : '#1e293b' }]}>
                      {transaction.title}
                    </Text>
                    <View style={styles.indexMessageDetails}>
                      <View style={styles.indexMessageDetailItem}>
                        <Ionicons name="calendar-outline" size={14} color={isDarkMode ? '#64748b' : '#94a3b8'} />
                        <Text style={[styles.indexMessageDetailText, { color: isDarkMode ? '#64748b' : '#94a3b8' }]}>
                          {transaction.date}
                        </Text>
                      </View>
                      <View style={styles.indexMessageDetailItem}>
                        <Ionicons name="cash-outline" size={14} color={isDarkMode ? '#64748b' : '#94a3b8'} />
                        <Text style={[styles.indexMessageDetailText, { color: isDarkMode ? '#64748b' : '#94a3b8' }]}>
                          RM {typeof transaction.amount === 'number' ? transaction.amount.toFixed(2) : transaction.amount}
                        </Text>
                      </View>
                    </View>
                  </View>
                ))}
              </ScrollView>
            )}
          </Animated.View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  transactionButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  cartButton: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#f97316',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  cartBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#fff',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#f97316',
  },
  cartBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#f97316',
  },
  workshopSection: {
    marginBottom: 24,
  },
  label: {
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 12,
  },
  workshopList: {
    flexDirection: 'row',
  },
  workshopListContent: {
    gap: 16,
    paddingHorizontal: 4,
  },
  workshopCard: {
    minWidth: 280,
    borderRadius: 16,
    overflow: 'hidden',
    flexDirection: 'column',
  },
  workshopCardImageContainer: {
    width: '100%',
    height: 80,
    justifyContent: 'flex-start',
  },
  workshopCardImage: {
    borderRadius: 0,
    resizeMode: 'contain',
  },
  workshopCardTextBackground: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 12,
    width: '100%',
  },
  workshopName: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  workshopLocation: {
    fontSize: 9,
    color: '#64748b',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    position: 'relative',
  },
  searchIcon: {
    position: 'absolute',
    left: 16,
    zIndex: 1,
  },
  searchInput: {
    flex: 1,
    height: 56,
    borderRadius: 16,
    paddingLeft: 48,
    paddingRight: 16,
    fontSize: 14,
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  productCard: {
    width: '47%',
    padding: 12,
    borderRadius: 16,
    gap: 8,
  },
  productImageContainer: {
    position: 'relative',
    marginBottom: 8,
  },
  productImage: {
    width: '100%',
    height: 128,
    borderRadius: 12,
  },
  stockBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  stockBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  productCategory: {
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  productName: {
    fontSize: 14,
    fontWeight: 'bold',
    flex: 1,
  },
  productFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  productPrice: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyCart: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyCartText: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyCartButton: {
    color: '#f97316',
    fontSize: 14,
    fontWeight: 'bold',
  },
  cartItems: {
    gap: 16,
    marginBottom: 24,
  },
  cartItem: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 16,
    gap: 16,
    alignItems: 'center',
  },
  cartItemImage: {
    width: 64,
    height: 64,
    borderRadius: 12,
  },
  cartItemInfo: {
    flex: 1,
    gap: 4,
  },
  cartItemName: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  cartItemQty: {
    fontSize: 12,
  },
  cartItemPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#f97316',
  },
  summary: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
    gap: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  workshopBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  workshopBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  divider: {
    height: 1,
    marginVertical: 16,
  },
  summaryTotalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  summaryTotalValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#f97316',
  },
  checkoutButton: {
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  checkoutButtonText: {
    fontSize: 16,
    fontWeight: '900',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxWidth: 800,
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: -40,
    right: 0,
    zIndex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    padding: 8,
  },
  zoomControls: {
    position: 'absolute',
    top: -40,
    right: 50,
    flexDirection: 'row',
    gap: 8,
    zIndex: 1,
  },
  zoomButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    padding: 8,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalImageContainer: {
    width: '100%',
    height: 400,
    borderRadius: 16,
    overflow: 'hidden',
  },
  modalImage: {
    width: '100%',
    height: 400,
    borderRadius: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    minHeight: 200,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    minHeight: 200,
  },
  errorText: {
    marginTop: 16,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 32,
  },
  retryButton: {
    backgroundColor: '#f97316',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    minHeight: 200,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 14,
    textAlign: 'center',
  },
  indexModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start',
  },
  indexModalContent: {
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    maxHeight: '80%',
    paddingTop: 60,
    paddingBottom: 20,
  },
  indexModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  indexModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  indexModalCloseButton: {
    padding: 4,
  },
  indexLoadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  indexLoadingText: {
    fontSize: 14,
    marginTop: 12,
  },
  indexEmptyContainer: {
    padding: 60,
    alignItems: 'center',
  },
  indexEmptyText: {
    fontSize: 14,
    marginTop: 16,
  },
  indexMessagesList: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  indexMessageCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  indexMessageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  indexMessageIdContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  indexMessageId: {
    fontSize: 12,
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  indexMessageStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  indexMessageStatusText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  indexMessageTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  indexMessageDetails: {
    flexDirection: 'row',
    gap: 16,
  },
  indexMessageDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  indexMessageDetailText: {
    fontSize: 12,
  },
});

export default ShopScreen;
