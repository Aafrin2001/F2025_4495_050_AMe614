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
import { useFontSize } from '../contexts/FontSizeContext';
import { useLanguage } from '../contexts/LanguageContext';

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
  const { getFontSize } = useFontSize();
  const { t } = useLanguage();
  const styles = MainScreenStyles(getFontSize);
  
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
            <Text style={styles.logoutText}>{t('main.logout')}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.welcomeCard}>
          <Text style={styles.welcomeTitle}>
            {t('main.welcome')}{user?.firstName ? ` ${user.firstName.charAt(0).toUpperCase() + user.firstName.slice(1)}` : ''}!
          </Text>
              <Text style={styles.welcomeSubtitle}>
                {t('main.ai_companion')}
              </Text>
        </View>

            <View style={[styles.featureGrid, isVerticalLayout && styles.verticalGrid]}>
              {showAsEmployer && (
                <TouchableOpacity style={[styles.featureCard, cardWidth === '100%' ? styles.fullWidthCard : styles.halfWidthCard]} onPress={onHealthMonitoring}>
                  <Ionicons name="heart-outline" size={32} color="#FFFFFF" style={styles.featureIcon} />
                  <Text style={styles.featureTitle}>{t('main.monitor')}</Text>
                </TouchableOpacity>
              )}

              {showAsProvider && (
                <TouchableOpacity style={[styles.featureCard, cardWidth === '100%' ? styles.fullWidthCard : styles.halfWidthCard]} onPress={onOfferSkills}>
                  <Ionicons name="fitness-outline" size={32} color="#FFFFFF" style={styles.featureIcon} />
                  <Text style={styles.featureTitle}>{t('main.activities')}</Text>
                </TouchableOpacity>
              )}

              {showAsEmployer && (
                <TouchableOpacity style={[styles.featureCard, cardWidth === '100%' ? styles.fullWidthCard : styles.halfWidthCard]} onPress={onCreateJob}>
                  <Ionicons name="medical-outline" size={32} color="#FFFFFF" style={styles.featureIcon} />
                  <Text style={styles.featureTitle}>{t('main.medication')}</Text>
                </TouchableOpacity>
              )}

              {showAsProvider && (
                <TouchableOpacity style={[styles.featureCard, cardWidth === '100%' ? styles.fullWidthCard : styles.halfWidthCard]} onPress={onViewJobs}>
                  <Ionicons name="analytics-outline" size={32} color="#FFFFFF" style={styles.featureIcon} />
                  <Text style={styles.featureTitle}>{t('main.dashboard')}</Text>
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity 
              style={styles.ctaCard}
              onPress={showAsEmployer ? onFindServices : onOfferSkills}
              activeOpacity={0.8}
            >
              <Text style={styles.ctaTitle}>{t('main.chat_ai')}</Text>
              <Text style={styles.ctaDescription}>
                {t('main.ai_easy')}
              </Text>
          {showAsEmployer && (
            <View style={styles.ctaButton}>
                  <Text style={styles.ctaButtonText}>{t('main.chat_ai')}</Text>
            </View>
          )}
          {showAsProvider && !showAsEmployer && (
            <View style={styles.ctaButton}>
              <Text style={styles.ctaButtonText}>{t('main.chat_ai')}</Text>
            </View>
          )}
        </TouchableOpacity>
      </ScrollView>
    </LinearGradient>
  );
};

const MainScreenStyles = (getFontSize: (base: number) => number) => StyleSheet.create({
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
    fontSize: getFontSize(28),
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
    fontSize: getFontSize(14),
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
    fontSize: getFontSize(24),
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  welcomeSubtitle: {
    fontSize: getFontSize(16),
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
    fontSize: getFontSize(16),
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  featureDescription: {
    fontSize: getFontSize(12),
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: getFontSize(16),
  },
  ctaCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    padding: 25,
    alignItems: 'center',
    marginBottom: 30,
  },
  ctaTitle: {
    fontSize: getFontSize(20),
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  ctaDescription: {
    fontSize: getFontSize(14),
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
    fontSize: getFontSize(16),
    fontWeight: '600',
  },
});

export default MainScreen;
