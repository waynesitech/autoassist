import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, Linking, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Transaction, Workshop } from '../types';
import { api } from '../services/api';

interface QuotationDetailScreenProps {
  visible: boolean;
  transactionId: string | null;
  isDarkMode: boolean;
  workshops: Workshop[];
  onClose: () => void;
}

const QuotationDetailScreen: React.FC<QuotationDetailScreenProps> = ({
  visible,
  transactionId,
  isDarkMode,
  workshops,
  onClose,
}) => {
  const [quotation, setQuotation] = useState<Transaction & { adminMessage?: string; quoteType?: 'brief' | 'detailed'; workshopId?: number } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible && transactionId) {
      loadQuotationDetails();
    } else {
      setQuotation(null);
    }
  }, [visible, transactionId]);

  const loadQuotationDetails = async () => {
    if (!transactionId) return;
    
    setLoading(true);
    try {
      const details = await api.getQuotationDetails(transactionId);
      console.log('Quotation details loaded:', details);
      console.log('Admin message:', details.adminMessage);
      // Handle both camelCase and snake_case field names
      if (!details.adminMessage && (details as any).admin_message) {
        details.adminMessage = (details as any).admin_message;
      }
      setQuotation(details);
    } catch (error) {
      console.error('Error loading quotation details:', error);
      Alert.alert('Error', 'Failed to load quotation details');
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleWhatsAppPress = () => {
    if (!quotation?.workshopId) {
      Alert.alert('Error', 'Workshop information not available');
      return;
    }

    const workshop = workshops.find(w => w.id === quotation.workshopId);
    if (!workshop) {
      Alert.alert('Error', 'Workshop not found');
      return;
    }

    // Admin WhatsApp number - update this with your actual admin contact number
    // Format: country code + number without + or spaces (e.g., 60123456789 for Malaysia)
    const adminPhoneNumber = '60123456789'; // TODO: Replace with actual admin phone number or get from config/API
    const message = `Hello, I have a question about my quotation ${quotation.id}`;
    const whatsappUrl = `https://wa.me/${adminPhoneNumber}?text=${encodeURIComponent(message)}`;
    
    Linking.openURL(whatsappUrl).catch(() => {
      Alert.alert('Error', 'Could not open WhatsApp. Please make sure WhatsApp is installed.');
    });
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: isDarkMode ? '#1e293b' : '#fff' }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: isDarkMode ? '#fff' : '#0f172a' }]}>
              Quotation Details
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={isDarkMode ? '#fff' : '#0f172a'} />
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <Text style={[styles.loadingText, { color: isDarkMode ? '#64748b' : '#94a3b8' }]}>
                Loading...
              </Text>
            </View>
          ) : quotation ? (
            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
              {/* Admin Message - Show at the top if available */}
              {quotation.adminMessage && quotation.adminMessage.trim() !== '' ? (
                <View style={[styles.adminMessageCard, { 
                  backgroundColor: isDarkMode ? 'rgba(249, 115, 22, 0.15)' : 'rgba(249, 115, 22, 0.1)',
                  borderColor: isDarkMode ? 'rgba(249, 115, 22, 0.3)' : 'rgba(249, 115, 22, 0.2)',
                }]}>
                  <View style={styles.adminMessageHeader}>
                    <Ionicons name="chatbubble-ellipses" size={20} color="#f97316" style={{ marginRight: 8 }} />
                    <Text style={[styles.adminMessageTitle, { color: isDarkMode ? '#f97316' : '#f97316' }]}>
                      Admin Message
                    </Text>
                  </View>
                  <Text style={[styles.adminMessageText, { color: isDarkMode ? '#f1f5f9' : '#1e293b' }]}>
                    {quotation.adminMessage}
                  </Text>
                </View>
              ) : null}

              <View style={[styles.card, { backgroundColor: isDarkMode ? '#0f172a' : '#f1f5f9' }]}>
                <View style={styles.cardHeader}>
                  <Text style={[styles.cardTitle, { color: isDarkMode ? '#f1f5f9' : '#1e293b' }]}>
                    Transaction Information
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: isDarkMode ? '#64748b' : '#94a3b8' }]}>ID:</Text>
                  <Text style={[styles.detailValue, { color: isDarkMode ? '#fff' : '#0f172a' }]}>{quotation.id}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: isDarkMode ? '#64748b' : '#94a3b8' }]}>Title:</Text>
                  <Text style={[styles.detailValue, { color: isDarkMode ? '#fff' : '#0f172a' }]}>{quotation.title}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: isDarkMode ? '#64748b' : '#94a3b8' }]}>Status:</Text>
                  <View
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor:
                          quotation.status === 'completed'
                            ? 'rgba(16, 185, 129, 0.2)'
                            : quotation.status === 'pending'
                            ? 'rgba(249, 115, 22, 0.2)'
                            : quotation.status === 'ongoing'
                            ? 'rgba(59, 130, 246, 0.2)'
                            : 'rgba(239, 68, 68, 0.2)',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        {
                          color:
                            quotation.status === 'completed'
                              ? '#10b981'
                              : quotation.status === 'pending'
                              ? '#f97316'
                              : quotation.status === 'ongoing'
                              ? '#3b82f6'
                              : '#ef4444',
                        },
                      ]}
                    >
                      {quotation.status?.toUpperCase()}
                    </Text>
                  </View>
                </View>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: isDarkMode ? '#64748b' : '#94a3b8' }]}>Amount:</Text>
                  <Text style={[styles.detailValue, { color: isDarkMode ? '#fff' : '#0f172a' }]}>
                    RM {typeof quotation.amount === 'number' ? quotation.amount.toFixed(2) : quotation.amount}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: isDarkMode ? '#64748b' : '#94a3b8' }]}>Date:</Text>
                  <Text style={[styles.detailValue, { color: isDarkMode ? '#fff' : '#0f172a' }]}>{quotation.date}</Text>
                </View>
                {quotation.quoteType && (
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: isDarkMode ? '#64748b' : '#94a3b8' }]}>Quote Type:</Text>
                    <Text style={[styles.detailValue, { color: isDarkMode ? '#fff' : '#0f172a' }]}>
                      {quotation.quoteType === 'brief' ? 'Brief Report' : 'Detailed Report'}
                    </Text>
                  </View>
                )}
              </View>

              {quotation.quoteType === 'detailed' && (
                <TouchableOpacity
                  style={styles.whatsappButton}
                  onPress={handleWhatsAppPress}
                >
                  <Ionicons name="logo-whatsapp" size={20} color="#fff" />
                  <Text style={styles.whatsappButtonText}>Contact Admin via WhatsApp</Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: isDarkMode ? '#64748b' : '#94a3b8' }]}>
                No quotation details found
              </Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingTop: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 4,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
  },
  content: {
    paddingHorizontal: 20,
  },
  card: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  cardHeader: {
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  adminMessageCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
  },
  adminMessageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  adminMessageTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  adminMessageText: {
    fontSize: 15,
    lineHeight: 22,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  whatsappButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#25D366',
    padding: 16,
    borderRadius: 12,
    gap: 8,
    marginTop: 8,
  },
  whatsappButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyContainer: {
    padding: 60,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
  },
});

export default QuotationDetailScreen;

