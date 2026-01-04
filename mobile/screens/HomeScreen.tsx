import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AdSlider from '../components/AdSlider';
import StatusBadge from '../components/StatusBadge';
import { Transaction, AppTab, User } from '../types';

interface HomeScreenProps {
  setActiveTab: (tab: AppTab) => void;
  isDarkMode: boolean;
  toggleTheme: () => void;
  transactions: Transaction[];
  user: User | null;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ setActiveTab, isDarkMode, toggleTheme, transactions, user }) => {
  const quickServices = [
    { id: 'quotation', label: 'Quote', icon: 'document-text', color: '#3b82f6' },
    { id: 'towing', label: 'Towing', icon: 'car', color: '#f97316' },
    { id: 'shop', label: 'Shop', icon: 'bag', color: '#a855f7' },
    { id: 'profile', label: 'Support', icon: 'headset', color: '#10b981' },
  ];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: isDarkMode ? '#020617' : '#F5F2F2' }]}
      contentContainerStyle={styles.content}
    >
      <View style={styles.header}>
        <View>
          <Text style={[styles.welcomeText, { color: isDarkMode ? '#64748b' : '#94a3b8' }]}>
            Welcome back,
          </Text>
          <Text style={[styles.userName, { color: isDarkMode ? '#fff' : '#0f172a' }]}>
            {user?.name || 'User'} 👋
          </Text>
        </View>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={[styles.iconButton, { backgroundColor: isDarkMode ? '#1e293b' : '#fff' }]}
            onPress={toggleTheme}
          >
            <Ionicons name={isDarkMode ? 'sunny' : 'moon'} size={20} color={isDarkMode ? '#f97316' : '#64748b'} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.avatarButton, { borderColor: '#f97316' }]}
            onPress={() => setActiveTab('profile')}
          >
            <Image
              source={{ uri: 'https://picsum.photos/id/64/100/100' }}
              style={styles.avatar}
            />
          </TouchableOpacity>
        </View>
      </View>

      <AdSlider />

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: isDarkMode ? '#fff' : '#0f172a' }]}>
          Quick Services
        </Text>
        <View style={styles.servicesGrid}>
          {quickServices.map((service) => (
            <TouchableOpacity
              key={service.id}
              style={styles.serviceCard}
              onPress={() => setActiveTab(service.id as AppTab)}
            >
              <View style={styles.serviceIcon}>
                <Ionicons name={service.icon as any} size={28} color={service.color} />
              </View>
              <Text style={[styles.serviceLabel, { color: isDarkMode ? '#94a3b8' : '#64748b' }]}>
                {service.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: isDarkMode ? '#fff' : '#0f172a' }]}>
            Recent Transactions
          </Text>
          <TouchableOpacity>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.transactionsList}>
          {transactions.map((tx) => (
            <View
              key={tx.id}
              style={[styles.transactionCard, { backgroundColor: isDarkMode ? '#1e293b' : '#fff' }]}
            >
              <View style={styles.transactionLeft}>
                <View
                  style={[
                    styles.transactionIcon,
                    {
                      backgroundColor:
                        tx.type === 'Towing'
                          ? 'rgba(249, 115, 22, 0.1)'
                          : tx.type === 'Quotation'
                          ? 'rgba(59, 130, 246, 0.1)'
                          : 'rgba(168, 85, 247, 0.1)',
                    },
                  ]}
                >
                  <Ionicons
                    name={tx.type === 'Towing' ? 'car' : tx.type === 'Quotation' ? 'document-text' : 'bag'}
                    size={20}
                    color={tx.type === 'Towing' ? '#f97316' : tx.type === 'Quotation' ? '#3b82f6' : '#a855f7'}
                  />
                </View>
                <View style={styles.transactionTextContainer}>
                  <Text 
                    style={[styles.transactionTitle, { color: isDarkMode ? '#f1f5f9' : '#1e293b' }]}
                    numberOfLines={2}
                    ellipsizeMode="tail"
                  >
                    {tx.title}
                  </Text>
                  <Text style={[styles.transactionDate, { color: isDarkMode ? '#64748b' : '#94a3b8' }]}>
                    {tx.date}
                  </Text>
                </View>
              </View>
              <View style={styles.transactionRight}>
                <Text style={[styles.transactionAmount, { color: isDarkMode ? '#fff' : '#0f172a' }]}>
                  RM {Number(tx.amount || 0).toFixed(2)}
                </Text>
                <StatusBadge status={tx.status} />
              </View>
            </View>
          ))}
        </View>
      </View>
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
  welcomeText: {
    fontSize: 14,
    fontWeight: '500',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  avatarButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    padding: 2,
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  viewAllText: {
    color: '#f97316',
    fontSize: 14,
    fontWeight: '600',
  },
  servicesGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  serviceCard: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 4,
  },
  serviceIcon: {
    width: 56,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  serviceLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  transactionsList: {
    gap: 16,
  },
  transactionCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flex: 1,
    minWidth: 0, // Allow flex to shrink below content size
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0, // Prevent icon from shrinking
  },
  transactionTextContainer: {
    flex: 1,
    minWidth: 0, // Allow text container to shrink
  },
  transactionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    flexShrink: 1,
  },
  transactionDate: {
    fontSize: 12,
    marginTop: 2,
  },
  transactionRight: {
    alignItems: 'flex-end',
    gap: 8,
    marginLeft: 12,
    flexShrink: 0, // Prevent right side from shrinking
  },
  transactionAmount: {
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default HomeScreen;
