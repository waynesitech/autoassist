import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Image, Alert, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ProfileSubView, Workshop, User, CarInfo } from '../types';
import { api } from '../services/api';
import { sessionStorage } from '../services/sessionStorage';

interface ProfileScreenProps {
  onLogout: () => void;
  isDarkMode: boolean;
  subView: ProfileSubView;
  setSubView: (v: ProfileSubView) => void;
  workshops: Workshop[];
  user: User | null;
  onUserUpdate: (user: User) => void;
}

const ProfileScreen: React.FC<ProfileScreenProps> = ({ onLogout, isDarkMode, subView, setSubView, workshops, user, onUserUpdate }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  // Notification settings state
  const [notifications, setNotifications] = useState({
    pushNotifications: true,
    emailNotifications: true,
    smsNotifications: false,
    orderUpdates: true,
    serviceReminders: true,
    promotions: false,
  });

  // Vehicles state
  const [vehicles, setVehicles] = useState<CarInfo[]>([]);
  const [showVehicleForm, setShowVehicleForm] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<CarInfo | null>(null);
  const [vehicleForm, setVehicleForm] = useState({
    model: '',
    year: '',
    chassis: '',
    engine: '',
    plateNumber: '',
  });

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      setPhone(user.phone || '');
    }
  }, [user]);

  // Load notification settings on mount and when user changes
  useEffect(() => {
    const loadNotificationSettings = async () => {
      if (user) {
        try {
          // Try to load from database first
          const saved = await api.getNotificationSettings(user.id);
          if (saved) {
            setNotifications(saved);
            // Also save to local storage as backup
            try {
              await sessionStorage.saveNotificationSettings(saved);
            } catch (localError) {
              console.error('Error saving to local storage:', localError);
            }
          }
        } catch (error) {
          console.error('Error loading notification settings from database:', error);
          // Fallback to local storage if API fails
          try {
            const localSaved = await sessionStorage.getNotificationSettings();
            if (localSaved) {
              setNotifications(localSaved);
            }
          } catch (localError) {
            console.error('Error loading notification settings from local storage:', localError);
          }
        }
      }
    };
    loadNotificationSettings();
  }, [user]);

  // Load vehicles on mount and when subView changes to my-vehicles
  useEffect(() => {
    if (subView === 'my-vehicles' && user) {
      const loadVehicles = async () => {
        try {
          const vehiclesData = await api.getVehicles(user.id);
          setVehicles(vehiclesData);
        } catch (error) {
          console.error('Error loading vehicles:', error);
          // Fallback to local storage if API fails
          try {
            const saved = await sessionStorage.getVehicles();
            if (saved) {
              setVehicles(saved);
            }
          } catch (localError) {
            console.error('Error loading vehicles from local storage:', localError);
          }
        }
      };
      loadVehicles();
    }
  }, [subView, user]);

  // Save notification settings when they change
  const handleNotificationToggle = async (key: keyof typeof notifications, value: boolean) => {
    if (!user) {
      return;
    }

    const updated = { ...notifications, [key]: value };
    setNotifications(updated);
    
    try {
      // Save to database
      await api.updateNotificationSettings(user.id, updated);
      
      // Also save to local storage as backup
      try {
        await sessionStorage.saveNotificationSettings(updated);
      } catch (localError) {
        console.error('Error saving to local storage:', localError);
      }
    } catch (error) {
      console.error('Error saving notification settings:', error);
      // Fallback to local storage if API fails
      try {
        await sessionStorage.saveNotificationSettings(updated);
      } catch (localError) {
        console.error('Error saving to local storage:', localError);
      }
    }
  };

  // Vehicle management functions
  const handleSaveVehicle = async () => {
    if (!user) {
      Alert.alert('Error', 'User not logged in');
      return;
    }

    if (!vehicleForm.model || !vehicleForm.year || !vehicleForm.chassis || !vehicleForm.engine) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      let savedVehicle: CarInfo;
      if (editingVehicle) {
        // Update existing vehicle
        savedVehicle = await api.updateVehicle(user.id, editingVehicle.id, vehicleForm);
        setVehicles(vehicles.map(v => v.id === editingVehicle.id ? savedVehicle : v));
      } else {
        // Add new vehicle
        savedVehicle = await api.createVehicle(user.id, vehicleForm);
        setVehicles([...vehicles, savedVehicle]);
      }

      // Also save to local storage as backup
      try {
        const updatedVehicles = editingVehicle 
          ? vehicles.map(v => v.id === editingVehicle.id ? savedVehicle : v)
          : [...vehicles, savedVehicle];
        await sessionStorage.saveVehicles(updatedVehicles);
      } catch (localError) {
        console.error('Error saving to local storage:', localError);
      }

      setShowVehicleForm(false);
      setEditingVehicle(null);
      setVehicleForm({ model: '', year: '', chassis: '', engine: '', plateNumber: '' });
      Alert.alert('Success', editingVehicle ? 'Vehicle updated successfully' : 'Vehicle added successfully');
    } catch (error: any) {
      console.error('Error saving vehicle:', error);
      Alert.alert('Error', error.message || 'Failed to save vehicle');
    }
  };

  const handleEditVehicle = (vehicle: CarInfo) => {
    setEditingVehicle(vehicle);
    setVehicleForm({
      model: vehicle.model,
      year: vehicle.year,
      chassis: vehicle.chassis,
      engine: vehicle.engine,
      plateNumber: vehicle.plateNumber || '',
    });
    setShowVehicleForm(true);
  };

  const handleDeleteVehicle = (vehicleId: string) => {
    if (!user) {
      Alert.alert('Error', 'User not logged in');
      return;
    }

    Alert.alert(
      'Delete Vehicle',
      'Are you sure you want to delete this vehicle?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.deleteVehicle(user.id, vehicleId);
              const updatedVehicles = vehicles.filter(v => v.id !== vehicleId);
              setVehicles(updatedVehicles);
              
              // Also update local storage as backup
              try {
                await sessionStorage.saveVehicles(updatedVehicles);
              } catch (localError) {
                console.error('Error updating local storage:', localError);
              }
              
              Alert.alert('Success', 'Vehicle deleted successfully');
            } catch (error: any) {
              console.error('Error deleting vehicle:', error);
              Alert.alert('Error', error.message || 'Failed to delete vehicle');
            }
          },
        },
      ]
    );
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const updateData: { name: string; email: string; phone?: string; password?: string } = {
        name,
        email,
      };

      if (phone) updateData.phone = phone;
      if (password && password.trim() !== '') updateData.password = password;

      const response = await api.updateUser(user.id, updateData);
      if (response.success) {
        onUserUpdate(response.user);
        setPassword('');
        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
          setSubView('main');
        }, 1500);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const Header = ({ title }: { title: string }) => (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => setSubView('main')}>
        <Ionicons name="arrow-back" size={24} color={isDarkMode ? '#94a3b8' : '#64748b'} />
      </TouchableOpacity>
      <Text style={[styles.headerTitle, { color: isDarkMode ? '#fff' : '#0f172a' }]}>{title}</Text>
    </View>
  );

  if (subView === 'notifications') {
    return (
      <ScrollView
        style={[styles.container, { backgroundColor: isDarkMode ? '#020617' : '#F5F2F2' }]}
        contentContainerStyle={styles.content}
      >
        <Header title="Notification Settings" />
        
        <View style={[styles.settingsCard, { backgroundColor: isDarkMode ? '#1e293b' : '#fff' }]}>
          <Text style={[styles.settingsSectionTitle, { color: isDarkMode ? '#f1f5f9' : '#1e293b' }]}>
            Push Notifications
          </Text>
          <Text style={[styles.settingsSectionDesc, { color: isDarkMode ? '#64748b' : '#94a3b8' }]}>
            Receive notifications on your device
          </Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingItemLeft}>
              <Ionicons name="notifications" size={20} color={isDarkMode ? '#64748b' : '#94a3b8'} />
              <View style={styles.settingItemText}>
                <Text style={[styles.settingItemLabel, { color: isDarkMode ? '#f1f5f9' : '#1e293b' }]}>
                  Push Notifications
                </Text>
                <Text style={[styles.settingItemSubtext, { color: isDarkMode ? '#64748b' : '#94a3b8' }]}>
                  Enable all push notifications
                </Text>
              </View>
            </View>
            <Switch
              value={notifications.pushNotifications}
              onValueChange={(value) => handleNotificationToggle('pushNotifications', value)}
              trackColor={{ false: isDarkMode ? '#1e293b' : '#cbd5e1', true: '#f97316' }}
              thumbColor={notifications.pushNotifications ? '#fff' : '#f4f3f4'}
            />
          </View>
        </View>

        <View style={[styles.settingsCard, { backgroundColor: isDarkMode ? '#1e293b' : '#fff' }]}>
          <Text style={[styles.settingsSectionTitle, { color: isDarkMode ? '#f1f5f9' : '#1e293b' }]}>
            Email Notifications
          </Text>
          <Text style={[styles.settingsSectionDesc, { color: isDarkMode ? '#64748b' : '#94a3b8' }]}>
            Receive updates via email
          </Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingItemLeft}>
              <Ionicons name="mail" size={20} color={isDarkMode ? '#64748b' : '#94a3b8'} />
              <View style={styles.settingItemText}>
                <Text style={[styles.settingItemLabel, { color: isDarkMode ? '#f1f5f9' : '#1e293b' }]}>
                  Email Notifications
                </Text>
                <Text style={[styles.settingItemSubtext, { color: isDarkMode ? '#64748b' : '#94a3b8' }]}>
                  Receive email updates
                </Text>
              </View>
            </View>
            <Switch
              value={notifications.emailNotifications}
              onValueChange={(value) => handleNotificationToggle('emailNotifications', value)}
              trackColor={{ false: isDarkMode ? '#1e293b' : '#cbd5e1', true: '#f97316' }}
              thumbColor={notifications.emailNotifications ? '#fff' : '#f4f3f4'}
            />
          </View>
        </View>

        <View style={[styles.settingsCard, { backgroundColor: isDarkMode ? '#1e293b' : '#fff' }]}>
          <Text style={[styles.settingsSectionTitle, { color: isDarkMode ? '#f1f5f9' : '#1e293b' }]}>
            SMS Notifications
          </Text>
          <Text style={[styles.settingsSectionDesc, { color: isDarkMode ? '#64748b' : '#94a3b8' }]}>
            Receive text message updates
          </Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingItemLeft}>
              <Ionicons name="chatbubbles" size={20} color={isDarkMode ? '#64748b' : '#94a3b8'} />
              <View style={styles.settingItemText}>
                <Text style={[styles.settingItemLabel, { color: isDarkMode ? '#f1f5f9' : '#1e293b' }]}>
                  SMS Notifications
                </Text>
                <Text style={[styles.settingItemSubtext, { color: isDarkMode ? '#64748b' : '#94a3b8' }]}>
                  Receive text messages
                </Text>
              </View>
            </View>
            <Switch
              value={notifications.smsNotifications}
              onValueChange={(value) => handleNotificationToggle('smsNotifications', value)}
              trackColor={{ false: isDarkMode ? '#1e293b' : '#cbd5e1', true: '#f97316' }}
              thumbColor={notifications.smsNotifications ? '#fff' : '#f4f3f4'}
            />
          </View>
        </View>

        <View style={[styles.settingsCard, { backgroundColor: isDarkMode ? '#1e293b' : '#fff' }]}>
          <Text style={[styles.settingsSectionTitle, { color: isDarkMode ? '#f1f5f9' : '#1e293b' }]}>
            Service Updates
          </Text>
          <Text style={[styles.settingsSectionDesc, { color: isDarkMode ? '#64748b' : '#94a3b8' }]}>
            Updates about your services and orders
          </Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingItemLeft}>
              <Ionicons name="bag" size={20} color={isDarkMode ? '#64748b' : '#94a3b8'} />
              <View style={styles.settingItemText}>
                <Text style={[styles.settingItemLabel, { color: isDarkMode ? '#f1f5f9' : '#1e293b' }]}>
                  Order Updates
                </Text>
                <Text style={[styles.settingItemSubtext, { color: isDarkMode ? '#64748b' : '#94a3b8' }]}>
                  Get notified about order status
                </Text>
              </View>
            </View>
            <Switch
              value={notifications.orderUpdates}
              onValueChange={(value) => handleNotificationToggle('orderUpdates', value)}
              trackColor={{ false: isDarkMode ? '#1e293b' : '#cbd5e1', true: '#f97316' }}
              thumbColor={notifications.orderUpdates ? '#fff' : '#f4f3f4'}
            />
          </View>

          <View style={[styles.settingItem, styles.settingItemLast]}>
            <View style={styles.settingItemLeft}>
              <Ionicons name="calendar" size={20} color={isDarkMode ? '#64748b' : '#94a3b8'} />
              <View style={styles.settingItemText}>
                <Text style={[styles.settingItemLabel, { color: isDarkMode ? '#f1f5f9' : '#1e293b' }]}>
                  Service Reminders
                </Text>
                <Text style={[styles.settingItemSubtext, { color: isDarkMode ? '#64748b' : '#94a3b8' }]}>
                  Reminders for scheduled services
                </Text>
              </View>
            </View>
            <Switch
              value={notifications.serviceReminders}
              onValueChange={(value) => handleNotificationToggle('serviceReminders', value)}
              trackColor={{ false: isDarkMode ? '#1e293b' : '#cbd5e1', true: '#f97316' }}
              thumbColor={notifications.serviceReminders ? '#fff' : '#f4f3f4'}
            />
          </View>
        </View>

        <View style={[styles.settingsCard, { backgroundColor: isDarkMode ? '#1e293b' : '#fff' }]}>
          <Text style={[styles.settingsSectionTitle, { color: isDarkMode ? '#f1f5f9' : '#1e293b' }]}>
            Marketing
          </Text>
          <Text style={[styles.settingsSectionDesc, { color: isDarkMode ? '#64748b' : '#94a3b8' }]}>
            Promotional offers and deals
          </Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingItemLeft}>
              <Ionicons name="pricetag" size={20} color={isDarkMode ? '#64748b' : '#94a3b8'} />
              <View style={styles.settingItemText}>
                <Text style={[styles.settingItemLabel, { color: isDarkMode ? '#f1f5f9' : '#1e293b' }]}>
                  Promotions & Offers
                </Text>
                <Text style={[styles.settingItemSubtext, { color: isDarkMode ? '#64748b' : '#94a3b8' }]}>
                  Receive special offers and deals
                </Text>
              </View>
            </View>
            <Switch
              value={notifications.promotions}
              onValueChange={(value) => handleNotificationToggle('promotions', value)}
              trackColor={{ false: isDarkMode ? '#1e293b' : '#cbd5e1', true: '#f97316' }}
              thumbColor={notifications.promotions ? '#fff' : '#f4f3f4'}
            />
          </View>
        </View>
      </ScrollView>
    );
  }

  if (subView === 'my-vehicles') {
    return (
      <ScrollView
        style={[styles.container, { backgroundColor: isDarkMode ? '#020617' : '#F5F2F2' }]}
        contentContainerStyle={styles.content}
      >
        <Header title="My Vehicles" />
        
        {!showVehicleForm ? (
          <>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => {
                setEditingVehicle(null);
                setVehicleForm({ model: '', year: '', chassis: '', engine: '', plateNumber: '' });
                setShowVehicleForm(true);
              }}
            >
              <Ionicons name="add-circle" size={20} color="#fff" />
              <Text style={styles.addButtonText}>Add Vehicle</Text>
            </TouchableOpacity>

            {vehicles.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="car-outline" size={64} color={isDarkMode ? 'rgba(148,163,184,0.1)' : 'rgba(100,116,139,0.2)'} />
                <Text style={[styles.emptyStateText, { color: isDarkMode ? '#64748b' : '#94a3b8' }]}>
                  No vehicles added yet
                </Text>
                <Text style={[styles.emptyStateSubtext, { color: isDarkMode ? '#475569' : '#64748b' }]}>
                  Add your first vehicle to get started
                </Text>
              </View>
            ) : (
              <View style={styles.vehiclesList}>
                {vehicles.map((vehicle) => (
                  <View
                    key={vehicle.id}
                    style={[styles.vehicleCard, { backgroundColor: isDarkMode ? '#1e293b' : '#fff' }]}
                  >
                    <View style={styles.vehicleCardHeader}>
                      <View style={styles.vehicleIconContainer}>
                        <Ionicons name="car-sport" size={24} color="#f97316" />
                      </View>
                      <View style={styles.vehicleInfo}>
                        <Text style={[styles.vehicleModel, { color: isDarkMode ? '#f1f5f9' : '#1e293b' }]}>
                          {vehicle.year} {vehicle.model}
                        </Text>
                        {vehicle.plateNumber && (
                          <Text style={[styles.vehiclePlate, { color: isDarkMode ? '#64748b' : '#94a3b8' }]}>
                            {vehicle.plateNumber}
                          </Text>
                        )}
                      </View>
                      <View style={styles.vehicleActions}>
                        <TouchableOpacity
                          style={styles.vehicleActionButton}
                          onPress={() => handleEditVehicle(vehicle)}
                        >
                          <Ionicons name="create-outline" size={18} color="#3b82f6" />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.vehicleActionButton}
                          onPress={() => handleDeleteVehicle(vehicle.id)}
                        >
                          <Ionicons name="trash-outline" size={18} color="#ef4444" />
                        </TouchableOpacity>
                      </View>
                    </View>
                    <View style={styles.vehicleDetails}>
                      <View style={styles.vehicleDetailItem}>
                        <Ionicons name="document-text-outline" size={16} color={isDarkMode ? '#64748b' : '#94a3b8'} />
                        <Text style={[styles.vehicleDetailLabel, { color: isDarkMode ? '#64748b' : '#94a3b8' }]}>
                          Chassis:
                        </Text>
                        <Text style={[styles.vehicleDetailValue, { color: isDarkMode ? '#f1f5f9' : '#1e293b' }]}>
                          {vehicle.chassis}
                        </Text>
                      </View>
                      <View style={styles.vehicleDetailItem}>
                        <Ionicons name="settings-outline" size={16} color={isDarkMode ? '#64748b' : '#94a3b8'} />
                        <Text style={[styles.vehicleDetailLabel, { color: isDarkMode ? '#64748b' : '#94a3b8' }]}>
                          Engine:
                        </Text>
                        <Text style={[styles.vehicleDetailValue, { color: isDarkMode ? '#f1f5f9' : '#1e293b' }]}>
                          {vehicle.engine}
                        </Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </>
        ) : (
          <View style={[styles.vehicleFormCard, { backgroundColor: isDarkMode ? '#1e293b' : '#fff' }]}>
            <Text style={[styles.formTitle, { color: isDarkMode ? '#f1f5f9' : '#1e293b' }]}>
              {editingVehicle ? 'Edit Vehicle' : 'Add New Vehicle'}
            </Text>

            <Text style={[styles.label, { color: isDarkMode ? '#475569' : '#64748b', paddingTop: 8 }]}>Model Name *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: isDarkMode ? '#0f172a' : '#f1f5f9', color: isDarkMode ? '#fff' : '#0f172a' }]}
              placeholder="e.g. Honda Civic RS"
              placeholderTextColor={isDarkMode ? '#64748b' : '#94a3b8'}
              value={vehicleForm.model}
              onChangeText={(text) => setVehicleForm({ ...vehicleForm, model: text })}
            />

            <Text style={[styles.label, { color: isDarkMode ? '#475569' : '#64748b', paddingTop: 8 }]}>Year *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: isDarkMode ? '#0f172a' : '#f1f5f9', color: isDarkMode ? '#fff' : '#0f172a' }]}
              placeholder="e.g. 2020"
              placeholderTextColor={isDarkMode ? '#64748b' : '#94a3b8'}
              value={vehicleForm.year}
              onChangeText={(text) => setVehicleForm({ ...vehicleForm, year: text })}
              keyboardType="numeric"
            />

            <Text style={[styles.label, { color: isDarkMode ? '#475569' : '#64748b', paddingTop: 8 }]}>Chassis Number *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: isDarkMode ? '#0f172a' : '#f1f5f9', color: isDarkMode ? '#fff' : '#0f172a' }]}
              placeholder="Enter chassis number"
              placeholderTextColor={isDarkMode ? '#64748b' : '#94a3b8'}
              value={vehicleForm.chassis}
              onChangeText={(text) => setVehicleForm({ ...vehicleForm, chassis: text })}
            />

            <Text style={[styles.label, { color: isDarkMode ? '#475569' : '#64748b', paddingTop: 8 }]}>Engine Number *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: isDarkMode ? '#0f172a' : '#f1f5f9', color: isDarkMode ? '#fff' : '#0f172a' }]}
              placeholder="Enter engine number"
              placeholderTextColor={isDarkMode ? '#64748b' : '#94a3b8'}
              value={vehicleForm.engine}
              onChangeText={(text) => setVehicleForm({ ...vehicleForm, engine: text })}
            />

            <Text style={[styles.label, { color: isDarkMode ? '#475569' : '#64748b', paddingTop: 8 }]}>Plate Number</Text>
            <TextInput
              style={[styles.input, { backgroundColor: isDarkMode ? '#0f172a' : '#f1f5f9', color: isDarkMode ? '#fff' : '#0f172a' }]}
              placeholder="e.g. ABC 1234"
              placeholderTextColor={isDarkMode ? '#64748b' : '#94a3b8'}
              value={vehicleForm.plateNumber}
              onChangeText={(text) => setVehicleForm({ ...vehicleForm, plateNumber: text })}
            />

            <View style={styles.formActions}>
              <TouchableOpacity
                style={[styles.cancelButton, { backgroundColor: isDarkMode ? '#1e293b' : '#f1f5f9' }]}
                onPress={() => {
                  setShowVehicleForm(false);
                  setEditingVehicle(null);
                  setVehicleForm({ model: '', year: '', chassis: '', engine: '', plateNumber: '' });
                }}
              >
                <Text style={[styles.cancelButtonText, { color: isDarkMode ? '#94a3b8' : '#64748b' }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveVehicleButton} onPress={handleSaveVehicle}>
                <Text style={styles.saveVehicleButtonText}>
                  {editingVehicle ? 'Update Vehicle' : 'Add Vehicle'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    );
  }

  if (subView === 'edit-profile') {
    return (
      <ScrollView
        style={[styles.container, { backgroundColor: isDarkMode ? '#020617' : '#F5F2F2' }]}
        contentContainerStyle={styles.content}
      >
        <Header title="Edit Profile" />
        <View style={styles.avatarContainer}>
          <Image source={{ uri: 'https://picsum.photos/id/64/200/200' }} style={styles.avatar} />
          <TouchableOpacity style={styles.cameraButton}>
            <Ionicons name="camera" size={16} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.form}>
          <Text style={[styles.label, { color: isDarkMode ? '#475569' : '#64748b' }]}>Full Name</Text>
          <TextInput
            style={[styles.input, { backgroundColor: isDarkMode ? '#1e293b' : '#fff', color: isDarkMode ? '#fff' : '#0f172a' }]}
            value={name}
            onChangeText={setName}
          />

          <Text style={[styles.label, { color: isDarkMode ? '#475569' : '#64748b' }]}>Email</Text>
          <TextInput
            style={[styles.input, { backgroundColor: isDarkMode ? '#1e293b' : '#fff', color: isDarkMode ? '#fff' : '#0f172a' }]}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Text style={[styles.label, { color: isDarkMode ? '#475569' : '#64748b' }]}>Phone Number</Text>
          <TextInput
            style={[styles.input, { backgroundColor: isDarkMode ? '#1e293b' : '#fff', color: isDarkMode ? '#fff' : '#0f172a' }]}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            placeholder="+60 12-345 6789"
            placeholderTextColor={isDarkMode ? '#64748b' : '#94a3b8'}
          />

          <Text style={[styles.label, { color: isDarkMode ? '#475569' : '#64748b' }]}>New Password (leave blank to keep current)</Text>
          <TextInput
            style={[styles.input, { backgroundColor: isDarkMode ? '#1e293b' : '#fff', color: isDarkMode ? '#fff' : '#0f172a' }]}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="Enter new password"
            placeholderTextColor={isDarkMode ? '#64748b' : '#94a3b8'}
          />

          {error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {success ? (
            <View style={styles.successContainer}>
              <Text style={styles.successText}>Profile updated successfully!</Text>
            </View>
          ) : null}

          <TouchableOpacity style={styles.saveButton} onPress={handleSaveProfile} disabled={loading}>
            {loading ? (
              <Text style={styles.saveButtonText}>Saving...</Text>
            ) : (
              <Text style={styles.saveButtonText}>Save Changes</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  // MAIN PROFILE MENU
  return (
    <ScrollView
      style={[styles.container, { backgroundColor: isDarkMode ? '#020617' : '#f8fafc' }]}
      contentContainerStyle={styles.content}
    >
      <View style={styles.profileHeader}>
        <View style={[styles.avatarLarge, { borderColor: '#f97316' }]}>
          <Image source={{ uri: 'https://picsum.photos/id/64/200/200' }} style={styles.avatarLargeImage} />
          <View style={styles.onlineIndicator} />
        </View>
        <Text style={[styles.userName, { color: isDarkMode ? '#fff' : '#0f172a' }]}>{user?.name || 'User'}</Text>
        <Text style={[styles.userEmail, { color: isDarkMode ? '#64748b' : '#94a3b8' }]}>{user?.email || ''}</Text>
      </View>

      <View style={styles.statsGrid}>
        {[
          { label: 'Quotes', value: '12', icon: 'document-text', color: '#3b82f6' },
          { label: 'Towings', value: '3', icon: 'car', color: '#f97316' },
          { label: 'Orders', value: '8', icon: 'bag', color: '#a855f7' },
        ].map((stat, i) => (
          <View key={i} style={[styles.statCard, { backgroundColor: isDarkMode ? '#1e293b' : '#fff' }]}>
            <Ionicons name={stat.icon as any} size={24} color={stat.color} style={{ opacity: 0.8 }} />
            <Text style={[styles.statValue, { color: isDarkMode ? '#fff' : '#0f172a' }]}>{stat.value}</Text>
            <Text style={[styles.statLabel, { color: isDarkMode ? '#64748b' : '#94a3b8' }]}>{stat.label}</Text>
          </View>
        ))}
      </View>

      <Text style={[styles.sectionLabel, { color: isDarkMode ? '#475569' : '#64748b' }]}>Account Settings</Text>
      <View style={[styles.menuCard, { backgroundColor: isDarkMode ? '#1e293b' : '#fff' }]}>
        {[
          { id: 'edit-profile', label: 'Edit Profile', icon: 'person' },
          { id: 'my-vehicles', label: 'My Vehicles', icon: 'car' },
          { id: 'notifications', label: 'Notification Settings', icon: 'notifications' },
        ].map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.menuItem}
            onPress={() => setSubView(item.id as ProfileSubView)}
          >
            <Ionicons name={item.icon as any} size={20} color={isDarkMode ? '#64748b' : '#94a3b8'} />
            <Text style={[styles.menuItemText, { color: isDarkMode ? '#f1f5f9' : '#1e293b' }]}>{item.label}</Text>
            <Ionicons name="chevron-forward" size={16} color={isDarkMode ? '#1e293b' : '#cbd5e1'} />
          </TouchableOpacity>
        ))}
      </View>

      <Text style={[styles.sectionLabel, { color: isDarkMode ? '#475569' : '#64748b' }]}>Help & Support</Text>
      <View style={[styles.menuCard, { backgroundColor: isDarkMode ? '#1e293b' : '#fff' }]}>
        {[
          { id: 'locations', label: 'Service Center Locations', icon: 'location' },
          { id: 'terms', label: 'Terms & Conditions', icon: 'document-text' },
          { id: 'help', label: 'Help Center', icon: 'help-circle' },
        ].map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.menuItem}
            onPress={() => setSubView(item.id as ProfileSubView)}
          >
            <Ionicons name={item.icon as any} size={20} color={isDarkMode ? '#64748b' : '#94a3b8'} />
            <Text style={[styles.menuItemText, { color: isDarkMode ? '#f1f5f9' : '#1e293b' }]}>{item.label}</Text>
            <Ionicons name="chevron-forward" size={16} color={isDarkMode ? '#1e293b' : '#cbd5e1'} />
          </TouchableOpacity>
        ))}
        <TouchableOpacity style={styles.menuItem} onPress={onLogout}>
          <Ionicons name="log-out" size={20} color="#ef4444" />
          <Text style={[styles.menuItemText, { color: '#ef4444' }]}>Logout</Text>
          <Ionicons name="chevron-forward" size={16} color={isDarkMode ? '#1e293b' : '#cbd5e1'} />
        </TouchableOpacity>
      </View>

      <Text style={[styles.version, { color: isDarkMode ? '#475569' : '#94a3b8' }]}>AutoAssist Malaysia v2.4.1</Text>
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
    alignItems: 'center',
    gap: 16,
    marginBottom: 32,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatarLarge: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 4,
    padding: 2,
    marginBottom: 16,
    position: 'relative',
  },
  avatarLargeImage: {
    width: '100%',
    height: '100%',
    borderRadius: 44,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#10b981',
    borderWidth: 4,
    borderColor: '#020617',
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    fontWeight: '500',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 32,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    gap: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '900',
  },
  statLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 12,
    marginLeft: 4,
  },
  menuCard: {
    borderRadius: 16,
    marginBottom: 24,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  menuItemText: {
    flex: 1,
    fontSize: 14,
    fontWeight: 'bold',
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 4,
    borderColor: 'rgba(249, 115, 22, 0.2)',
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f97316',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#020617',
  },
  form: {
    gap: 24,
  },
  label: {
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 8,
    marginLeft: 4,
  },
  input: {
    height: 56,
    borderRadius: 16,
    paddingHorizontal: 16,
    fontSize: 14,
  },
  errorContainer: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
    borderRadius: 12,
    padding: 12,
  },
  errorText: {
    color: '#fca5a5',
    fontSize: 14,
  },
  successContainer: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
    borderRadius: 12,
    padding: 12,
  },
  successText: {
    color: '#6ee7b7',
    fontSize: 14,
  },
  saveButton: {
    backgroundColor: '#f97316',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  version: {
    textAlign: 'center',
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 4,
    marginTop: 48,
  },
  settingsCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  settingsSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  settingsSectionDesc: {
    fontSize: 12,
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  settingItemLast: {
    borderBottomWidth: 0,
  },
  settingItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  settingItemText: {
    flex: 1,
  },
  settingItemLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  settingItemSubtext: {
    fontSize: 12,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f97316',
    padding: 16,
    borderRadius: 16,
    marginBottom: 24,
    gap: 8,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 4,
  },
  emptyStateSubtext: {
    fontSize: 14,
  },
  vehiclesList: {
    gap: 16,
  },
  vehicleCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  vehicleCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  vehicleIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(249, 115, 22, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  vehicleInfo: {
    flex: 1,
  },
  vehicleModel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  vehiclePlate: {
    fontSize: 12,
    fontWeight: '500',
  },
  vehicleActions: {
    flexDirection: 'row',
    gap: 8,
  },
  vehicleActionButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  vehicleDetails: {
    gap: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  vehicleDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  vehicleDetailLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  vehicleDetailValue: {
    fontSize: 12,
    fontWeight: 'bold',
    flex: 1,
  },
  vehicleFormCard: {
    borderRadius: 16,
    padding: 20,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  formActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  cancelButton: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  saveVehicleButton: {
    flex: 1,
    backgroundColor: '#f97316',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  saveVehicleButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ProfileScreen;
