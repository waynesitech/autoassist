import React, { useState, useMemo, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Image, Alert, ImageBackground, Modal, PanResponder, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Workshop, Transaction } from '../types';
import { WORKSHOPS } from '../constants';
import { analyzeCarCondition } from '../services/geminiService';
import { api } from '../services/api';
import { sessionStorage } from '../services/sessionStorage';
import { WORKSHOP_BANNER_IMAGE } from '../constants';
import QuotationDetailScreen from './QuotationDetailScreen';

interface QuotationScreenProps {
  isDarkMode: boolean;
  selectedWorkshop: Workshop | null;
  setSelectedWorkshop: (w: Workshop) => void;
  workshops: Workshop[];
  onUnreadCountChange?: () => void;
}

const QuotationScreen: React.FC<QuotationScreenProps> = ({ isDarkMode, selectedWorkshop, setSelectedWorkshop, workshops, onUnreadCountChange }) => {
  const [form, setForm] = useState({ model: '', year: '', chassis: '', engine: '', description: '' });
  const [quoteType, setQuoteType] = useState<'brief' | 'detailed'>('brief');
  const [images, setImages] = useState<string[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [aiResult, setAiResult] = useState<any>(null);
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [imageScale, setImageScale] = useState(1);
  const [imageTranslate, setImageTranslate] = useState({ x: 0, y: 0 });
  const lastPanRef = useRef({ x: 0, y: 0 });
  const [indexModalVisible, setIndexModalVisible] = useState(false);
  const [indexMessages, setIndexMessages] = useState<Transaction[]>([]);
  const [loadingIndex, setLoadingIndex] = useState(false);
  const [readMessageIds, setReadMessageIds] = useState<Set<string>>(new Set());
  const slideAnim = useRef(new Animated.Value(-1000)).current;
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(null);

  useEffect(() => {
    const maxLength = quoteType === 'brief' ? 100 : 300;
    if (form.description.length > maxLength) {
      setForm({ ...form, description: form.description.substring(0, maxLength) });
    }
    const maxPhotos = quoteType === 'brief' ? 3 : 6;
    if (images.length > maxPhotos) {
      setImages(images.slice(0, maxPhotos));
    }
  }, [quoteType]);

  const pickImage = async () => {
    const maxPhotos = quoteType === 'brief' ? 3 : 6;
    const remainingSlots = maxPhotos - images.length;
    
    if (remainingSlots <= 0) {
      Alert.alert('Limit Reached', `Maximum ${maxPhotos} photos allowed for ${quoteType === 'brief' ? 'brief' : 'detailed'} report.`);
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.8,
      base64: true,
      allowsMultipleSelection: true,
      selectionLimit: remainingSlots,
    });

    if (!result.canceled && result.assets.length > 0) {
      const newImages = result.assets.map(asset => `data:image/jpeg;base64,${asset.base64}`);
      const totalImages = [...images, ...newImages].slice(0, maxPhotos);
      setImages(totalImages);
    }
  };

  const handleAnalyze = async () => {
    if (images.length === 0) return;
    setAnalyzing(true);
    const result = await analyzeCarCondition(images[0], `${form.year} ${form.model}`);
    setAiResult(result);
    setAnalyzing(false);
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

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

  const handleSubmit = async () => {
    if (!selectedWorkshop) {
      Alert.alert('Error', 'Please select a workshop first');
      return;
    }
    if (!form.model || !form.year || !form.engine || !form.chassis) {
      Alert.alert('Error', 'Please fill in all required fields (Model, Year, Engine, Chassis)');
      return;
    }
    try {
      // Get user from session storage
      const user = await sessionStorage.getUser();
      await api.createQuotation({
        type: quoteType === 'brief' ? 'Brief' : 'Detailed',
        model: form.model,
        year: form.year,
        engine: form.engine,
        chassis: form.chassis,
        description: form.description,
        quoteType: quoteType,
        images: images,
        workshopId: selectedWorkshop.id,
        amount: quoteType === 'brief' ? 5 : 15,
        userId: user?.id || null,
      });
      Alert.alert('Success', 'Quotation request submitted!');
      // Reset form after successful submission
      setForm({ model: '', year: '', chassis: '', engine: '', description: '' });
      setImages([]);
    } catch (error) {
      Alert.alert('Error', 'Failed to submit quotation');
    }
  };

  const handleShowIndex = async () => {
    setIndexModalVisible(true);
    setLoadingIndex(true);
    try {
      const transactions = await api.getTransactions();
      const quotationTransactions = transactions.filter(t => t.type === 'Quotation');
      setIndexMessages(quotationTransactions);
      
      // Mark all messages as read when opening the modal
      const allMessageIds = quotationTransactions.map(t => t.id || '').filter(id => id);
      const newReadIds = new Set([...readMessageIds, ...allMessageIds]);
      setReadMessageIds(newReadIds);
      
      // Save to storage
      await sessionStorage.saveReadQuotationMessages(Array.from(newReadIds));
      
      // Notify parent component to update unread count
      if (onUnreadCountChange) {
        onUnreadCountChange();
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load index messages');
      setIndexMessages([]);
    } finally {
      setLoadingIndex(false);
    }
    // Animate slide from top
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 50,
      friction: 8,
    }).start();
  };

  const handleCloseIndex = () => {
    Animated.timing(slideAnim, {
      toValue: -1000,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setIndexModalVisible(false);
    });
  };

  useEffect(() => {
    if (!indexModalVisible) {
      slideAnim.setValue(-1000);
    }
  }, [indexModalVisible]);

  // Load read message IDs on mount and when messages change
  useEffect(() => {
    const loadReadMessages = async () => {
      try {
        const readIds = await sessionStorage.getReadQuotationMessages();
        setReadMessageIds(new Set(readIds));
      } catch (error) {
        console.error('Error loading read messages:', error);
      }
    };
    loadReadMessages();
  }, []);

  // Load messages and calculate unread count
  useEffect(() => {
    const loadMessages = async () => {
      try {
        const transactions = await api.getTransactions();
        const quotationTransactions = transactions.filter(t => t.type === 'Quotation');
        setIndexMessages(quotationTransactions);
        // Notify parent component to update unread count
        if (onUnreadCountChange) {
          onUnreadCountChange();
        }
      } catch (error) {
        console.error('Error loading messages:', error);
      }
    };
    loadMessages();
  }, [onUnreadCountChange]);

  // Calculate unread count
  const unreadCount = useMemo(() => {
    return indexMessages.filter(msg => !readMessageIds.has(msg.id || '')).length;
  }, [indexMessages, readMessageIds]);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: isDarkMode ? '#020617' : '#F5F2F2' }]}
      contentContainerStyle={styles.content}
    >
      <View style={styles.headerRow}>
        <View style={styles.titleContainer}>
          <Text style={[styles.title, { color: isDarkMode ? '#fff' : '#0f172a' }]}>Vehicle Quotation</Text>
          <Text style={[styles.subtitle, { color: isDarkMode ? '#64748b' : '#94a3b8' }]}>
            Get professional valuation for your vehicle in minutes.
          </Text>
        </View>
        <TouchableOpacity
          style={[
            styles.indexButton,
            {
              backgroundColor: isDarkMode ? '#1e293b' : '#fff',
              borderColor: isDarkMode ? 'rgba(255,255,255,0.1)' : '#e2e8f0',
            },
          ]}
          onPress={handleShowIndex}
        >
          <Ionicons name="list" size={20} color="#f97316" />
          {unreadCount > 0 && (
            <View style={styles.indexBadge}>
              <Text style={styles.indexBadgeText}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.workshopSection}>
        <Text style={[styles.label, { color: isDarkMode ? '#475569' : '#64748b' }]}>Select Workshop Partner</Text>
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
        <Text style={[styles.cardTitle, { color: isDarkMode ? '#f1f5f9' : '#1e293b' }]}>Car Information</Text>
        <TextInput
          style={[styles.input, { backgroundColor: isDarkMode ? '#0f172a' : '#f1f5f9', color: isDarkMode ? '#fff' : '#0f172a' }]}
          placeholder="Model Name (e.g. Honda Civic RS)"
          placeholderTextColor={isDarkMode ? '#64748b' : '#94a3b8'}
          value={form.model}
          onChangeText={(text) => setForm({ ...form, model: text })}
        />
        <View style={styles.row}>
          <TextInput
            style={[styles.input, styles.halfInput, { backgroundColor: isDarkMode ? '#0f172a' : '#f1f5f9', color: isDarkMode ? '#fff' : '#0f172a' }]}
            placeholder="Year"
            placeholderTextColor={isDarkMode ? '#64748b' : '#94a3b8'}
            value={form.year}
            onChangeText={(text) => setForm({ ...form, year: text })}
          />
          <TextInput
            style={[styles.input, styles.halfInput, { backgroundColor: isDarkMode ? '#0f172a' : '#f1f5f9', color: isDarkMode ? '#fff' : '#0f172a' }]}
            placeholder="Engine No."
            placeholderTextColor={isDarkMode ? '#64748b' : '#94a3b8'}
            value={form.engine}
            onChangeText={(text) => setForm({ ...form, engine: text })}
          />
        </View>
        <TextInput
          style={[styles.input, { backgroundColor: isDarkMode ? '#0f172a' : '#f1f5f9', color: isDarkMode ? '#fff' : '#0f172a' }]}
          placeholder="Chassis Number"
          placeholderTextColor={isDarkMode ? '#64748b' : '#94a3b8'}
          value={form.chassis}
          onChangeText={(text) => setForm({ ...form, chassis: text })}
        />
      </View>

      <View style={styles.quoteTypeContainer}>
        <TouchableOpacity
          style={[styles.quoteTypeCard, quoteType === 'brief' && styles.quoteTypeCardActive]}
          onPress={() => setQuoteType('brief')}
        >
          <Ionicons name="trophy" size={24} color={quoteType === 'brief' ? '#f97316' : '#64748b'} />
          <Text style={[styles.quoteTypePrice, { color: isDarkMode ? '#fff' : '#0f172a' }]}>RM 5</Text>
          <Text style={[styles.quoteTypeTitle, { color: isDarkMode ? '#f1f5f9' : '#1e293b' }]}>Brief Report</Text>
          <Text style={styles.quoteTypeDesc}>Quick market valuation estimate.</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.quoteTypeCard, quoteType === 'detailed' && styles.quoteTypeCardActive]}
          onPress={() => setQuoteType('detailed')}
        >
          <Ionicons name="flash" size={24} color={quoteType === 'detailed' ? '#f97316' : '#64748b'} />
          <Text style={[styles.quoteTypePrice, { color: isDarkMode ? '#fff' : '#0f172a' }]}>RM 15</Text>
          <Text style={[styles.quoteTypeTitle, { color: isDarkMode ? '#f1f5f9' : '#1e293b' }]}>Detailed</Text>
          <Text style={styles.quoteTypeDesc}>Full condition & market analysis.</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.card, { backgroundColor: isDarkMode ? '#1e293b' : '#fff' }]}>
        <Text style={[styles.cardTitle, { color: isDarkMode ? '#f1f5f9' : '#1e293b' }]}>Vehicle Photos</Text>
        <Text style={[styles.photoLimitText, { color: isDarkMode ? '#64748b' : '#94a3b8' }]}>
          {images.length} / {quoteType === 'brief' ? 3 : 6} photos
        </Text>
        {images.length > 0 && (
          <View style={styles.imagesGrid}>
            {images.map((img, index) => (
              <View key={index} style={styles.imageContainer}>
                <Image source={{ uri: img }} style={styles.imageThumbnail} />
                <TouchableOpacity
                  style={styles.removeImageButton}
                  onPress={() => removeImage(index)}
                >
                  <Ionicons name="close-circle" size={24} color="#ef4444" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
        {images.length < (quoteType === 'brief' ? 3 : 6) && (
          <TouchableOpacity style={styles.uploadButton} onPress={pickImage}>
            <Ionicons name="cloud-upload-outline" size={32} color="#64748b" />
            <Text style={styles.uploadText}>Upload Close-Up Photos of the Vehicle Damage</Text>
          </TouchableOpacity>
        )}
        {images.length > 0 && (
          <>
            <TouchableOpacity style={styles.analyzeButton} onPress={handleAnalyze} disabled={analyzing}>
              <Ionicons name="sparkles" size={16} color="#fff" />
              <Text style={styles.analyzeButtonText}>AI Analysis</Text>
            </TouchableOpacity>
            {analyzing && <Text style={styles.analyzingText}>AI is evaluating vehicle condition...</Text>}
            {aiResult && (
              <View style={styles.aiResult}>
                <Text style={styles.aiResultTitle}>AI Assessment Result</Text>
                <Text style={styles.aiResultCondition}>{aiResult.condition}</Text>
              </View>
            )}
          </>
        )}
      </View>

      <View style={[styles.card, { backgroundColor: isDarkMode ? '#1e293b' : '#fff' }]}>
        <Text style={[styles.cardTitle, { color: isDarkMode ? '#f1f5f9' : '#1e293b' }]}>Description</Text>
        <TextInput
          style={[styles.textArea, { backgroundColor: isDarkMode ? '#0f172a' : '#f1f5f9', color: isDarkMode ? '#fff' : '#0f172a' }]}
          placeholder="Add any additional details about your vehicle (optional)"
          placeholderTextColor={isDarkMode ? '#64748b' : '#94a3b8'}
          value={form.description}
          onChangeText={(text) => {
            const maxLength = quoteType === 'brief' ? 100 : 300;
            if (text.length <= maxLength) {
              setForm({ ...form, description: text });
            }
          }}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          maxLength={quoteType === 'brief' ? 100 : 300}
        />
        <Text style={[styles.characterCount, { color: isDarkMode ? '#64748b' : '#94a3b8' }]}>
          {form.description.length} / {quoteType === 'brief' ? 100 : 300} characters
        </Text>
      </View>

      <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={!selectedWorkshop}>
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
        visible={indexModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCloseIndex}
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
            <View style={styles.indexModalHeader}>
              <Text style={[styles.indexModalTitle, { color: isDarkMode ? '#fff' : '#0f172a' }]}>
                Quotation History
              </Text>
              <TouchableOpacity
                onPress={handleCloseIndex}
                style={styles.indexModalCloseButton}
              >
                <Ionicons name="close" size={24} color={isDarkMode ? '#fff' : '#0f172a'} />
              </TouchableOpacity>
            </View>
            
            {loadingIndex ? (
              <View style={styles.indexLoadingContainer}>
                <Text style={[styles.indexLoadingText, { color: isDarkMode ? '#64748b' : '#94a3b8' }]}>
                  Loading index messages...
                </Text>
              </View>
            ) : indexMessages.length === 0 ? (
              <View style={styles.indexEmptyContainer}>
                <Ionicons name="document-text-outline" size={64} color={isDarkMode ? 'rgba(148,163,184,0.1)' : 'rgba(100,116,139,0.2)'} />
                <Text style={[styles.indexEmptyText, { color: isDarkMode ? '#64748b' : '#94a3b8' }]}>
                  No index messages found
                </Text>
              </View>
            ) : (
              <ScrollView style={styles.indexMessagesList} showsVerticalScrollIndicator={false}>
                {indexMessages.map((message, index) => {
                  const isUnread = !readMessageIds.has(message.id || '');
                  return (
                    <TouchableOpacity
                      key={message.id || index}
                      style={[
                        styles.indexMessageCard,
                        { backgroundColor: isDarkMode ? '#0f172a' : '#f1f5f9' },
                        isUnread && styles.indexMessageCardUnread,
                      ]}
                      onPress={() => {
                        setSelectedTransactionId(message.id);
                        setDetailModalVisible(true);
                      }}
                      activeOpacity={0.7}
                    >
                    <View style={styles.indexMessageHeader}>
                      <View style={styles.indexMessageIdContainer}>
                        <Text style={[styles.indexMessageId, { color: isDarkMode ? '#f97316' : '#f97316' }]}>
                          {message.id}
                        </Text>
                        {isUnread && (
                          <View style={styles.indexMessageUnreadDot} />
                        )}
                      </View>
                      <View
                        style={[
                          styles.indexMessageStatus,
                          {
                            backgroundColor:
                              message.status === 'completed'
                                ? 'rgba(16, 185, 129, 0.2)'
                                : message.status === 'pending'
                                ? 'rgba(249, 115, 22, 0.2)'
                                : message.status === 'ongoing'
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
                                message.status === 'completed'
                                  ? '#10b981'
                                  : message.status === 'pending'
                                  ? '#f97316'
                                  : message.status === 'ongoing'
                                  ? '#3b82f6'
                                  : '#ef4444',
                            },
                          ]}
                        >
                          {message.status?.toUpperCase()}
                        </Text>
                      </View>
                    </View>
                    <Text style={[styles.indexMessageTitle, { color: isDarkMode ? '#f1f5f9' : '#1e293b' }]}>
                      {message.title}
                    </Text>
                    <View style={styles.indexMessageDetails}>
                      <View style={styles.indexMessageDetailItem}>
                        <Ionicons name="calendar-outline" size={14} color={isDarkMode ? '#64748b' : '#94a3b8'} />
                        <Text style={[styles.indexMessageDetailText, { color: isDarkMode ? '#64748b' : '#94a3b8' }]}>
                          {message.date}
                        </Text>
                      </View>
                      <View style={styles.indexMessageDetailItem}>
                        <Ionicons name="cash-outline" size={14} color={isDarkMode ? '#64748b' : '#94a3b8'} />
                        <Text style={[styles.indexMessageDetailText, { color: isDarkMode ? '#64748b' : '#94a3b8' }]}>
                          RM {typeof message.amount === 'number' ? message.amount.toFixed(2) : message.amount}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}
          </Animated.View>
        </View>
      </Modal>

      <QuotationDetailScreen
        visible={detailModalVisible}
        transactionId={selectedTransactionId}
        isDarkMode={isDarkMode}
        workshops={workshops}
        onClose={() => {
          setDetailModalVisible(false);
          setSelectedTransactionId(null);
        }}
      />
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 24,
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
  input: {
    height: 48,
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 12,
    fontSize: 14,
  },
  textArea: {
    minHeight: 100,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 12,
    fontSize: 14,
  },
  characterCount: {
    fontSize: 12,
    textAlign: 'right',
    marginTop: -8,
    marginBottom: 4,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },
  quoteTypeContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  quoteTypeCard: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.05)',
    gap: 8,
  },
  quoteTypeCardActive: {
    borderColor: '#f97316',
    backgroundColor: 'rgba(249, 115, 22, 0.1)',
  },
  quoteTypePrice: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  quoteTypeTitle: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  quoteTypeDesc: {
    fontSize: 10,
    color: '#64748b',
  },
  imagePreview: {
    width: '100%',
    height: 192,
    borderRadius: 12,
    marginBottom: 12,
  },
  photoLimitText: {
    fontSize: 12,
    marginBottom: 12,
  },
  imagesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 12,
  },
  imageContainer: {
    position: 'relative',
    width: '48%',
    aspectRatio: 1,
  },
  imageThumbnail: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  uploadButton: {
    height: 192,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#1e293b',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  uploadText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#64748b',
  },
  analyzeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 24,
    gap: 8,
  },
  analyzeButtonText: {
    color: '#020617',
    fontSize: 12,
    fontWeight: 'bold',
  },
  analyzingText: {
    marginTop: 12,
    color: '#64748b',
    fontSize: 12,
    textAlign: 'center',
  },
  aiResult: {
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.2)',
  },
  aiResultTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#818cf8',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  aiResultCondition: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#f1f5f9',
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  titleContainer: {
    flex: 1,
  },
  indexButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
    borderWidth: 1,
    position: 'relative',
  },
  indexBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#ef4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    borderWidth: 2,
    borderColor: '#fff',
  },
  indexBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
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
  indexMessageCardUnread: {
    borderLeftWidth: 3,
    borderLeftColor: '#f97316',
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
  indexMessageUnreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#f97316',
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

export default QuotationScreen;
