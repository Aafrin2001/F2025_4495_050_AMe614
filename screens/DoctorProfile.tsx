import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';

interface DoctorProfileProps {
  onNavigate: (screen: string) => void;
}

export default function DoctorProfile({ onNavigate }: DoctorProfileProps) {
  return (
    <SafeAreaView style={styles.container}>
      {/* Header with Background Image */}
      <View style={styles.headerContainer}>
        <Image 
          source={{ uri: 'https://images.unsplash.com/photo-1506905925346-14b1e3ddfe9b?w=800&h=400&fit=crop' }}
          style={styles.headerBackground}
          resizeMode="cover"
        />
        
        {/* Back Button */}
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => onNavigate('healthcare')}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>

        {/* User Avatar */}
        <View style={styles.avatarContainer}>
          <Image 
            source={{ uri: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=150&h=150&fit=crop&crop=face' }}
            style={styles.avatar}
          />
        </View>

        {/* Info Card */}
        <View style={styles.infoCard}>
          <Text style={styles.doctorName}>Dr. Akin Tunde</Text>
          <View style={styles.locationContainer}>
            <Text style={styles.locationIcon}>📍</Text>
            <Text style={styles.locationText}>America</Text>
          </View>
        </View>
      </View>

      {/* Content Area */}
      <ScrollView style={styles.contentArea}>
        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity style={styles.activeTab}>
            <Text style={styles.activeTabText}>Overview</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.inactiveTab}>
            <Text style={styles.inactiveTabText}>Details</Text>
          </TouchableOpacity>
        </View>

        {/* Status Indicators */}
        <View style={styles.statusContainer}>
          <View style={styles.statusItem}>
            <Text style={styles.statusIcon}>🕐</Text>
            <Text style={styles.statusText}>6:30pm</Text>
          </View>
          <View style={styles.statusItem}>
            <Text style={styles.statusIcon}>☁️</Text>
            <Text style={styles.statusText}>16°C</Text>
          </View>
          <View style={styles.statusItem}>
            <Text style={styles.statusIcon}>⭐</Text>
            <Text style={styles.statusText}>4.5</Text>
          </View>
        </View>

        {/* Description */}
        <View style={styles.descriptionContainer}>
          <Text style={styles.descriptionText}>
            Dr. Akin Tunde is a renowned healthcare professional specializing in geriatric care and preventive medicine. With over 15 years of experience, he provides comprehensive health management for elderly patients, focusing on maintaining independence and quality of life.
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity style={styles.emergencyButton}>
            <Text style={styles.emergencyButtonText}>Emergency / Call</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.bookButton}>
            <Text style={styles.bookButtonText}>Book Now</Text>
            <Text style={styles.bookIcon}>✈️</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNavigation}>
        <TouchableOpacity style={styles.navItem}>
          <View style={styles.navIconContainer}>
            <Text style={styles.navIcon}>○</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <View style={styles.navIconContainer}>
            <Text style={styles.navIconActive}>●</Text>
          </View>
          <View style={styles.navIndicator} />
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => onNavigate('walk')}
        >
          <View style={styles.navIconContainer}>
            <Text style={styles.navIcon}>○</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => onNavigate('family')}
        >
          <View style={styles.navIconContainer}>
            <Text style={styles.navIcon}>○</Text>
          </View>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  headerContainer: {
    height: 300,
    position: 'relative',
  },
  headerBackground: {
    width: '100%',
    height: '100%',
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  avatarContainer: {
    position: 'absolute',
    top: 50,
    right: 20,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  infoCard: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 20,
    borderRadius: 12,
  },
  doctorName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  locationText: {
    fontSize: 16,
    color: '#FFFFFF',
  },
  contentArea: {
    flex: 1,
    padding: 20,
  },
  tabsContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  activeTab: {
    marginRight: 30,
  },
  activeTabText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  inactiveTab: {
    marginRight: 30,
  },
  inactiveTabText: {
    fontSize: 18,
    color: '#6B7280',
  },
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 30,
    paddingVertical: 20,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
  },
  statusItem: {
    alignItems: 'center',
  },
  statusIcon: {
    fontSize: 20,
    marginBottom: 8,
  },
  statusText: {
    fontSize: 14,
    color: '#6B7280',
  },
  descriptionContainer: {
    marginBottom: 30,
  },
  descriptionText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#6B7280',
  },
  actionButtonsContainer: {
    marginBottom: 20,
  },
  emergencyButton: {
    backgroundColor: '#1F2937',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  emergencyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  bookButton: {
    backgroundColor: '#1F2937',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  bookButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  bookIcon: {
    fontSize: 16,
  },
  bottomNavigation: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    paddingBottom: 34,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  navItem: {
    alignItems: 'center',
    position: 'relative',
  },
  navIconContainer: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navIcon: {
    fontSize: 16,
    color: '#6B7280',
  },
  navIconActive: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: 'bold',
  },
  navIndicator: {
    position: 'absolute',
    bottom: -8,
    left: '50%',
    marginLeft: -15,
    width: 30,
    height: 2,
    backgroundColor: '#1F2937',
    borderRadius: 1,
  },
});
