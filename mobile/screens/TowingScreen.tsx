import React, { useState, useMemo, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, ImageBackground, Modal, Image, PanResponder, ActivityIndicator, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { Workshop, AppTab, Transaction } from '../types';
import { api } from '../services/api';
import { sessionStorage } from '../services/sessionStorage';
import { WORKSHOP_BANNER_IMAGE } from '../constants';

interface TowingScreenProps {
  isDarkMode: boolean;
  selectedWorkshop: Workshop | null;
  setSelectedWorkshop: (w: Workshop) => void;
  workshops: Workshop[];
  onActionComplete: () => void;
  setActiveTab?: (tab: AppTab) => void;
}

const TowingScreen: React.FC<TowingScreenProps> = ({ isDarkMode, selectedWorkshop, setSelectedWorkshop, workshops, onActionComplete, setActiveTab }) => {
  const [pickup, setPickup] = useState('');
  const [destination, setDestination] = useState(selectedWorkshop?.name || '');
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [imageScale, setImageScale] = useState(1);
  const [imageTranslate, setImageTranslate] = useState({ x: 0, y: 0 });
  const [detectingLocation, setDetectingLocation] = useState(false);
  const lastPanRef = useRef({ x: 0, y: 0 });
  const [transactionModalVisible, setTransactionModalVisible] = useState(false);
  const [towingTransactions, setTowingTransactions] = useState<Transaction[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const slideAnim = useRef(new Animated.Value(-1000)).current;

  useEffect(() => {
    if (selectedWorkshop) {
      setDestination(selectedWorkshop.name);
    }
  }, [selectedWorkshop]);

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

  const estimatePrice = useMemo(() => {
    if (!pickup && !destination) return 0;
    return 500; // Fixed rate
  }, [pickup, destination]);

  const getCurrentLocation = async () => {
    setDetectingLocation(true);
    try {
      console.log('Requesting location permissions...');
      // Request location permissions
      const { status } = await Location.requestForegroundPermissionsAsync();
      console.log('Location permission status:', status);
      
      if (status !== 'granted') {
        Alert.alert(
          'Permission Denied',
          'Location permission is required to detect your current location. Please enable it in your device settings.',
          [{ text: 'OK' }]
        );
        setDetectingLocation(false);
        return;
      }

      console.log('Getting current position...');
      // Get current location
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      console.log('Location obtained:', location.coords);

      // Reverse geocode to get address
      console.log('Reverse geocoding...');
      const addresses = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
      console.log('Addresses:', addresses);

      if (addresses && addresses.length > 0) {
        const address = addresses[0];
        // Format address - try different address formats
        const addressParts = [
          address.name,
          address.street,
          address.streetNumber,
          address.district,
          address.subregion,
          address.city,
          address.region,
          address.postalCode,
          address.country,
        ].filter(Boolean);
        
        const formattedAddress = addressParts.length > 0 
          ? addressParts.join(', ')
          : `${location.coords.latitude.toFixed(6)}, ${location.coords.longitude.toFixed(6)}`;
        
        console.log('Formatted address:', formattedAddress);
        setPickup(formattedAddress);
      } else {
        // Fallback to coordinates if reverse geocoding fails
        const coords = `${location.coords.latitude.toFixed(6)}, ${location.coords.longitude.toFixed(6)}`;
        console.log('Using coordinates as fallback:', coords);
        setPickup(coords);
      }
    } catch (error: any) {
      console.error('Error getting location:', error);
      Alert.alert(
        'Location Error',
        error?.message || 'Failed to detect your current location. Please enter your location manually.',
        [{ text: 'OK' }]
      );
    } finally {
      setDetectingLocation(false);
    }
  };

  const handleRequest = async () => {
    if (!selectedWorkshop) {
      Alert.alert('Error', 'Please select a workshop first');
      return;
    }
    if (!pickup) {
      Alert.alert('Error', 'Please enter pickup location');
      return;
    }
    try {
      // Get user from session storage
      const user = await sessionStorage.getUser();
      
      await api.createTowingRequest({
        workshopId: selectedWorkshop.id,
        workshopName: selectedWorkshop.name,
        amount: estimatePrice,
        pickup,
        destination: destination || selectedWorkshop.name,
        userId: user?.id || null,
      });
      Alert.alert('Success', `Request sent to ${selectedWorkshop.name}!`);
      // Reset form after successful submission
      setPickup('');
      setDestination(selectedWorkshop.name);
      onActionComplete();
    } catch (e) {
      Alert.alert('Error', 'Database error. Please try again.');
    }
  };

  const handleShowTransactions = async () => {
    setTransactionModalVisible(true);
    setLoadingTransactions(true);
    try {
      const transactions = await api.getTransactions();
      const towingTxs = transactions.filter(t => t.type === 'Towing');
      setTowingTransactions(towingTxs);
    } catch (error) {
      Alert.alert('Error', 'Failed to load towing transactions');
      setTowingTransactions([]);
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

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: isDarkMode ? '#020617' : '#F5F2F2' }]}
      contentContainerStyle={styles.content}
    >
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={[styles.title, { color: isDarkMode ? '#fff' : '#0f172a' }]}>Towing Service</Text>
          <Text style={[styles.subtitle, { color: isDarkMode ? '#64748b' : '#94a3b8' }]}>
            Professional car recovery available 24/7.
          </Text>
        </View>
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
      </View>

      <View style={styles.workshopSection}>
        <Text style={[styles.label, { color: isDarkMode ? '#475569' : '#64748b' }]}>Direct To Workshop Partner</Text>
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

      <View style={[styles.card, { backgroundColor: isDarkMode ? '#1e293b' : '#fff' }]}>
        <Text style={[styles.cardTitle, { color: isDarkMode ? '#f1f5f9' : '#1e293b' }]}>Service Details</Text>
        
        <View style={styles.locationRow}>
          <View style={[styles.locationIcon, { backgroundColor: 'rgba(59, 130, 246, 0.1)' }]}>
            <Ionicons name="location" size={16} color="#3b82f6" />
          </View>
          <View style={styles.locationInput}>
            <Text style={[styles.inputLabel, { color: isDarkMode ? '#64748b' : '#94a3b8' }]}>Pickup Location</Text>
            {!pickup ? (
              <TouchableOpacity
                style={[styles.detectButton, { backgroundColor: isDarkMode ? '#1e3a8a' : '#3b82f6' }]}
                onPress={getCurrentLocation}
                disabled={detectingLocation}
              >
                {detectingLocation ? (
                  <>
                    <ActivityIndicator size="small" color="#fff" style={{ marginRight: 8 }} />
                    <Text style={styles.detectButtonText}>Detecting location...</Text>
                  </>
                ) : (
                  <>
                    <Ionicons name="location" size={18} color="#fff" style={{ marginRight: 8 }} />
                    <Text style={styles.detectButtonText}>Click to detect current location</Text>
                  </>
                )}
              </TouchableOpacity>
            ) : (
              <View style={styles.inputContainer}>
                <TextInput
                  style={[styles.input, { backgroundColor: isDarkMode ? '#0f172a' : '#f1f5f9', color: isDarkMode ? '#fff' : '#0f172a' }]}
                  placeholder="Current location"
                  placeholderTextColor={isDarkMode ? '#64748b' : '#94a3b8'}
                  value={pickup}
                  onChangeText={setPickup}
                  editable={true}
                />
                <TouchableOpacity
                  style={styles.clearButton}
                  onPress={() => setPickup('')}
                >
                  <Ionicons name="close-circle" size={20} color={isDarkMode ? '#64748b' : '#94a3b8'} />
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        <View style={styles.locationRow}>
          <View style={[styles.locationIcon, { backgroundColor: 'rgba(249, 115, 22, 0.1)' }]}>
            <Ionicons name="flag" size={16} color="#f97316" />
          </View>
          <View style={styles.locationInput}>
            <Text style={[styles.inputLabel, { color: isDarkMode ? '#64748b' : '#94a3b8' }]}>Destination</Text>
            <TextInput
              style={[styles.input, { backgroundColor: isDarkMode ? '#0f172a' : '#f1f5f9', color: isDarkMode ? '#fff' : '#0f172a' }]}
              placeholder="Where to send?"
              placeholderTextColor={isDarkMode ? '#64748b' : '#94a3b8'}
              value={destination}
              onChangeText={setDestination}
            />
          </View>
        </View>
      </View>

      <View style={[styles.priceCard, { backgroundColor: isDarkMode ? '#1e293b' : '#0f172a' }]}>
        <Text style={styles.priceLabel}>Estimated Total</Text>
        <Text style={styles.priceAmount}>RM {estimatePrice.toFixed(2)}</Text>
      </View>

      <TouchableOpacity style={styles.submitButton} onPress={handleRequest} disabled={!selectedWorkshop}>
        <Text style={styles.submitButtonText}>Submit & Pay</Text>
      </TouchableOpacity>

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
                Towing Transactions
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
            ) : towingTransactions.length === 0 ? (
              <View style={styles.indexEmptyContainer}>
                <Ionicons name="car-outline" size={64} color={isDarkMode ? 'rgba(148,163,184,0.1)' : 'rgba(100,116,139,0.2)'} />
                <Text style={[styles.indexEmptyText, { color: isDarkMode ? '#64748b' : '#94a3b8' }]}>
                  No towing transactions found
                </Text>
              </View>
            ) : (
              <ScrollView style={styles.indexMessagesList} showsVerticalScrollIndicator={false}>
                {towingTransactions.map((transaction, index) => (
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
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 0,
  },
  transactionButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    marginLeft: 12,
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
  workshopCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  workshopRating: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fbbf24',
  },
  workshopName: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  workshopLocation: {
    fontSize: 9,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  card: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  locationRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  locationIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
  locationInput: {
    flex: 1,
  },
  inputContainer: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
  },
  detectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 12,
    marginTop: 4,
  },
  detectButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  clearButton: {
    position: 'absolute',
    right: 12,
    padding: 4,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 8,
  },
  input: {
    height: 48,
    borderRadius: 12,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  priceCard: {
    padding: 24,
    borderRadius: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  priceLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 4,
  },
  priceAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  submitButton: {
    backgroundColor: '#f97316',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#f97316',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
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
    borderBottomColor: 'rgba(255,255,255,0.1)',
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

export default TowingScreen;
