import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { NavigationContainer, NavigationContainerRef, useFocusEffect } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { View, ActivityIndicator, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { AppTab, ProfileSubView, CartItem, Product, Workshop, Transaction, User } from './types';
import { api } from './services/api';
import { sessionStorage } from './services/sessionStorage';
import SplashScreen from './screens/SplashScreen';
import OnboardingScreen from './screens/OnboardingScreen';
import LoginScreen from './screens/LoginScreen';
import HomeScreen from './screens/HomeScreen';
import QuotationScreen from './screens/QuotationScreen';
import TowingScreen from './screens/TowingScreen';
import ShopScreen from './screens/ShopScreen';
import ProfileScreen from './screens/ProfileScreen';

type AppState = 'splash' | 'onboarding' | 'login' | 'main';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>('splash');
  const [activeTab, setActiveTab] = useState<AppTab>('home');
  const [profileSubView, setProfileSubView] = useState<ProfileSubView>('main');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isDarkMode, setIsDarkMode] = useState(true);
  
  // Database States
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedWorkshop, setSelectedWorkshop] = useState<Workshop | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [quotationUnreadCount, setQuotationUnreadCount] = useState(0);
  
  // Navigation ref for programmatic navigation
  const navigationRef = useRef<NavigationContainerRef<any>>(null);
  
  // Map lowercase tab names to capitalized screen names
  const navigateToTab = (tab: AppTab) => {
    const screenMap: Record<AppTab, string> = {
      'home': 'Home',
      'quotation': 'Quotation',
      'towing': 'Towing',
      'shop': 'Shop',
      'profile': 'Profile',
    };
    
    const screenName = screenMap[tab];
    if (screenName && navigationRef.current) {
      navigationRef.current.navigate(screenName);
      setActiveTab(tab);
    }
  };

  // Check for saved session on app startup
  useEffect(() => {
    const checkSession = async () => {
      try {
        const savedUser = await sessionStorage.getUser();
        const hasSeenOnboarding = await sessionStorage.hasSeenOnboarding();
        
        if (savedUser) {
          // User is logged in, restore session
          setUser(savedUser);
          setAppState('main');
        } else if (hasSeenOnboarding) {
          // User has seen onboarding but not logged in
          setAppState('login');
        } else {
          // First time user, show onboarding after splash
          const timer = setTimeout(() => setAppState('onboarding'), 2500);
          return () => clearTimeout(timer);
        }
      } catch (error) {
        console.error('Error checking session:', error);
        // On error, default to onboarding after splash
        const timer = setTimeout(() => setAppState('onboarding'), 2500);
        return () => clearTimeout(timer);
      } finally {
        setIsCheckingSession(false);
      }
    };
    
    // Only check session once on initial mount
    if (appState === 'splash') {
      checkSession();
    }
  }, []); // Empty dependency array - only run on mount

  // Initial Data Load from "MySQL"
  useEffect(() => {
    if (appState === 'main') {
      const loadData = async () => {
        setIsLoading(true);
        setLoadError(null);
        try {
          // Load workshops and transactions separately to allow partial success
          // Home screen only needs transactions, workshops are for other screens
          const [wsResult, txsResult] = await Promise.allSettled([
            api.getWorkshops(),
            api.getTransactions()
          ]);
          
          // Handle workshops (optional for home screen)
          if (wsResult.status === 'fulfilled') {
            const ws = wsResult.value;
            setWorkshops(ws);
            if (ws.length > 0) {
              setSelectedWorkshop(ws[0]);
            }
          } else {
            console.warn("Failed to load workshops:", wsResult.reason);
            setWorkshops([]);
            // Don't block home screen if workshops fail
          }
          
          // Handle transactions (needed for home screen)
          if (txsResult.status === 'fulfilled') {
            setTransactions(txsResult.value);
            // Update quotation unread count
            updateQuotationUnreadCount(txsResult.value);
          } else {
            console.error("Failed to load transactions:", txsResult.reason);
            setTransactions([]);
            // Only show error if transactions fail (needed for home screen)
            const errorMessage = txsResult.reason?.message || 'Failed to connect to server. Please check your connection and ensure the server is running.';
            setLoadError(errorMessage);
          }
        } catch (error: any) {
          console.error("Failed to load DB data", error);
          const errorMessage = error?.message || 'Failed to connect to server. Please check your connection and ensure the server is running.';
          setLoadError(errorMessage);
          // Set empty arrays to prevent infinite loading
          setWorkshops([]);
          setTransactions([]);
        } finally {
          setIsLoading(false);
        }
      };
      loadData();
    } else {
      // Reset loading state when not in main state
      setIsLoading(false);
      setLoadError(null);
    }
  }, [appState]);

  // Reset profile subview when changing tabs
  useEffect(() => {
    setProfileSubView('main');
  }, [activeTab]);

  const refreshTransactions = async () => {
    const txs = await api.getTransactions();
    setTransactions(txs);
    // Update quotation unread count
    updateQuotationUnreadCount(txs);
  };

  const updateQuotationUnreadCount = async (allTransactions?: Transaction[]) => {
    try {
      const transactions = allTransactions || await api.getTransactions();
      const quotationTransactions = transactions.filter(t => t.type === 'Quotation');
      const readIds = await sessionStorage.getReadQuotationMessages();
      const readSet = new Set(readIds);
      const unreadCount = quotationTransactions.filter(msg => !readSet.has(msg.id || '')).length;
      setQuotationUnreadCount(unreadCount);
    } catch (error) {
      console.error('Error updating quotation unread count:', error);
      setQuotationUnreadCount(0);
    }
  };

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: number) => {
    setCart((prev) => prev.filter(item => item.id !== productId));
  };

  const cartCount = useMemo(() => cart.reduce((acc, item) => acc + item.quantity, 0), [cart]);

  // Show loading while checking session
  if (isCheckingSession && appState === 'splash') {
    return <SplashScreen />;
  }

  if (appState === 'splash') {
    return <SplashScreen />;
  }

  if (appState === 'onboarding') {
    return (
      <OnboardingScreen 
        onComplete={async () => {
          await sessionStorage.setOnboardingSeen();
          setAppState('login');
        }} 
      />
    );
  }

  if (appState === 'login') {
    return (
      <LoginScreen 
        onLogin={async (user) => { 
          try {
            // Save user session
            await sessionStorage.saveUser(user);
            setUser(user); 
            setAppState('main');
          } catch (error) {
            console.error('Error saving session:', error);
            // Still proceed with login even if saving fails
            setUser(user); 
            setAppState('main');
          }
        }} 
      />
    );
  }

  // Show error state if loading failed (check this first before loading screen)
  // Only show error if transactions failed (critical for home screen)
  // Allow app to proceed if only workshops failed (they're optional)
  if (appState === 'main' && loadError && !isLoading && transactions.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
        <Text style={styles.errorText}>{loadError}</Text>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={async () => {
            setIsLoading(true);
            setLoadError(null);
            try {
              // Load workshops and transactions separately
              const [wsResult, txsResult] = await Promise.allSettled([
                api.getWorkshops(),
                api.getTransactions()
              ]);
              
              if (wsResult.status === 'fulfilled') {
                const ws = wsResult.value;
                setWorkshops(ws);
                if (ws.length > 0) {
                  setSelectedWorkshop(ws[0]);
                }
              } else {
                console.warn("Failed to load workshops:", wsResult.reason);
                setWorkshops([]);
              }
              
              if (txsResult.status === 'fulfilled') {
                setTransactions(txsResult.value);
                setLoadError(null);
                // Update quotation unread count
                updateQuotationUnreadCount(txsResult.value);
              } else {
                console.error("Failed to load transactions:", txsResult.reason);
                setLoadError(txsResult.reason?.message || 'Failed to connect to server. Please check your connection and ensure the server is running.');
              }
            } catch (error: any) {
              console.error("Failed to load DB data", error);
              setLoadError(error?.message || 'Failed to connect to server. Please check your connection and ensure the server is running.');
            } finally {
              setIsLoading(false);
            }
          }}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Only show loading screen when in main state and actually loading
  if (appState === 'main' && isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#f97316" />
        <Text style={styles.loadingText}>Connecting database...</Text>
      </View>
    );
  }

  const MainTabs = () => (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;
          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Quotation') {
            iconName = focused ? 'document-text' : 'document-text-outline';
          } else if (route.name === 'Towing') {
            iconName = focused ? 'car' : 'car-outline';
          } else if (route.name === 'Shop') {
            iconName = focused ? 'bag' : 'bag-outline';
          } else {
            iconName = focused ? 'person' : 'person-outline';
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#f97316',
        tabBarInactiveTintColor: isDarkMode ? '#64748b' : '#94a3b8',
        tabBarStyle: {
          backgroundColor: isDarkMode ? '#0f172a' : '#F5F2F2',
          borderTopColor: isDarkMode ? 'rgba(255,255,255,0.1)' : '#e2e8f0',
        },
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="Home" 
        children={() => (
          <HomeScreen 
            setActiveTab={navigateToTab} 
            isDarkMode={isDarkMode} 
            toggleTheme={toggleTheme} 
            transactions={transactions}
            user={user}
          />
        )}
      />
      <Tab.Screen 
        name="Quotation"
        options={{
          tabBarBadge: quotationUnreadCount > 0 ? quotationUnreadCount : undefined,
        }}
        listeners={{
          tabPress: () => {
            // Refresh unread count when tab is pressed
            updateQuotationUnreadCount();
          },
        }}
        children={() => (
          <QuotationScreen 
            isDarkMode={isDarkMode}
            selectedWorkshop={selectedWorkshop}
            setSelectedWorkshop={setSelectedWorkshop}
            workshops={workshops}
            onUnreadCountChange={updateQuotationUnreadCount}
          />
        )}
      />
      <Tab.Screen 
        name="Towing" 
        children={() => (
          <TowingScreen 
            isDarkMode={isDarkMode}
            selectedWorkshop={selectedWorkshop}
            setSelectedWorkshop={setSelectedWorkshop}
            workshops={workshops}
            onActionComplete={refreshTransactions}
            setActiveTab={navigateToTab}
          />
        )}
      />
      <Tab.Screen 
        name="Shop" 
        options={{
          tabBarBadge: cartCount > 0 ? cartCount : undefined,
        }}
        children={() => (
          <ShopScreen 
            cart={cart}
            setCart={setCart}
            addToCart={addToCart}
            removeFromCart={removeFromCart}
            isDarkMode={isDarkMode}
            selectedWorkshop={selectedWorkshop}
            setSelectedWorkshop={setSelectedWorkshop}
            workshops={workshops}
            onActionComplete={refreshTransactions}
          />
        )}
      />
      <Tab.Screen 
        name="Profile" 
        children={() => (
          <ProfileScreen 
            onLogout={async () => { 
              try {
                await sessionStorage.clearUser();
              } catch (error) {
                console.error('Error clearing session:', error);
              }
              setUser(null); 
              setAppState('login'); 
            }} 
            isDarkMode={isDarkMode} 
            subView={profileSubView} 
            setSubView={setProfileSubView}
            workshops={workshops}
            user={user}
            onUserUpdate={async (updatedUser) => {
              setUser(updatedUser);
              // Update saved session with new user data
              try {
                await sessionStorage.saveUser(updatedUser);
              } catch (error) {
                console.error('Error updating session:', error);
              }
            }}
          />
        )}
      />
    </Tab.Navigator>
  );

  return (
    <NavigationContainer ref={navigationRef}>
      <StatusBar style={isDarkMode ? 'light' : 'dark'} />
      <MainTabs />
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#020617',
    padding: 32,
  },
  loadingText: {
    marginTop: 16,
    color: '#64748b',
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  errorText: {
    marginTop: 16,
    color: '#fca5a5',
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
});

export default App;
