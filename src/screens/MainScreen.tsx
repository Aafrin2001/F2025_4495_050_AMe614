import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { User } from '../types';

interface MainScreenProps {
  user: User | null;
  onLogout: () => void;
  onFindServices: () => void;
  onOfferSkills: () => void;
  onSettingsPress: () => void;
  onCreateJob: () => void;
  onViewJobs: () => void;
  onHealthMonitoring: () => void;
}

const MainScreen: React.FC<MainScreenProps> = ({ 
  user,
  onLogout, 
  onFindServices, 
  onOfferSkills, 
  onSettingsPress, 
  onCreateJob, 
  onViewJobs,
  onHealthMonitoring
}) => {
  // For this demo, we'll show all features
  const showAsEmployer = true;
  const showAsProvider = true;
  
  // Calculate how many feature cards will be shown
  const visibleCardsCount = (showAsEmployer ? 2 : 0) + (showAsProvider ? 2 : 0);
  
      // Determine card width and layout based on visible cards
      let cardWidth: number | string = '48%';
      let isVerticalLayout = false;
      
      if (visibleCardsCount === 2) {
        cardWidth = '100%'; // Two cards stacked vertically
        isVerticalLayout = true;
      } else if (visibleCardsCount === 3) {
        cardWidth = '48%'; // Three cards: 2 on top row, 1 on bottom
      } else {
        cardWidth = '48%'; // Four cards: 2x2 grid (default)
      }
      
      // Special case: if only one view is enabled, stack cards vertically
      const isOnlyOneViewEnabled = (showAsEmployer && !showAsProvider) || (!showAsEmployer && showAsProvider);
      if (isOnlyOneViewEnabled) {
        cardWidth = '100%'; // Full width for vertical stacking
        isVerticalLayout = true;
      }

  return (
    <LinearGradient
      colors={['#667eea', '#764ba2']}
      style={styles.container}
    >
      <StatusBar style="light" />
      
      <View style={styles.header}>
        <Text style={styles.logo}>EnabledAi</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity onPress={onSettingsPress} style={styles.settingsButton}>
            <Ionicons name="settings-outline" size={20} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity onPress={onLogout} style={styles.logoutButton}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.welcomeCard}>
          <Text style={styles.welcomeTitle}>
            Welcome{user?.firstName ? ` ${user.firstName}` : ''} to EAi!
          </Text>
              <Text style={styles.welcomeSubtitle}>
                AI-powered health companion
              </Text>
        </View>

            <View style={[styles.featureGrid, isVerticalLayout && styles.verticalGrid]}>
              {showAsEmployer && (
                <TouchableOpacity style={[styles.featureCard, cardWidth === '100%' ? styles.fullWidthCard : styles.halfWidthCard]} onPress={onHealthMonitoring}>
                  <Ionicons name="heart-outline" size={32} color="#FFFFFF" style={styles.featureIcon} />
                  <Text style={styles.featureTitle}>Monitor</Text>
                </TouchableOpacity>
              )}

              {showAsProvider && (
                <TouchableOpacity style={[styles.featureCard, cardWidth === '100%' ? styles.fullWidthCard : styles.halfWidthCard]} onPress={onOfferSkills}>
                  <Ionicons name="fitness-outline" size={32} color="#FFFFFF" style={styles.featureIcon} />
                  <Text style={styles.featureTitle}>Activities</Text>
                </TouchableOpacity>
              )}

              {showAsEmployer && (
                <TouchableOpacity style={[styles.featureCard, cardWidth === '100%' ? styles.fullWidthCard : styles.halfWidthCard]} onPress={onCreateJob}>
                  <Ionicons name="medical-outline" size={32} color="#FFFFFF" style={styles.featureIcon} />
                  <Text style={styles.featureTitle}>Medication</Text>
                </TouchableOpacity>
              )}

              {showAsProvider && (
                <TouchableOpacity style={[styles.featureCard, cardWidth === '100%' ? styles.fullWidthCard : styles.halfWidthCard]} onPress={onViewJobs}>
                  <Ionicons name="analytics-outline" size={32} color="#FFFFFF" style={styles.featureIcon} />
                  <Text style={styles.featureTitle}>Dashboard</Text>
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity 
              style={styles.ctaCard} 
              onPress={onFindServices}
              activeOpacity={0.8}
            >
              <Text style={styles.ctaTitle}>Chat with AI</Text>
              <Text style={styles.ctaDescription}>
                {showAsEmployer && showAsProvider 
                  ? 'Let AI make things easy'
                  : showAsEmployer 
                    ? 'Let AI make things easy'
                    : 'Let AI make things easy'
                }
              </Text>
          {showAsEmployer && (
            <View style={styles.ctaButton}>
                  <Text style={styles.ctaButtonText}>Chat with AI</Text>
            </View>
          )}
          {showAsProvider && !showAsEmployer && (
            <View style={styles.ctaButton}>
              <Text style={styles.ctaButtonText}>Emergency Support</Text>
            </View>
          )}
        </TouchableOpacity>
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logo: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  settingsButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  logoutButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  logoutText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  welcomeCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    padding: 25,
    marginBottom: 30,
    alignItems: 'center',
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  featureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  verticalGrid: {
    flexDirection: 'column',
    alignItems: 'center',
  },
      featureCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        borderRadius: 15,
        padding: 20,
        marginBottom: 15,
        alignItems: 'center',
        minHeight: 120,
      },
      fullWidthCard: {
        width: '100%',
      },
      halfWidthCard: {
        width: '48%',
      },
  featureIcon: {
    marginBottom: 10,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  featureDescription: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 16,
  },
  ctaCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    padding: 25,
    alignItems: 'center',
    marginBottom: 30,
  },
  ctaTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  ctaDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginBottom: 20,
  },
  ctaButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 25,
    paddingHorizontal: 30,
    paddingVertical: 12,
  },
  ctaButtonText: {
    color: '#667eea',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default MainScreen;
