import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { User } from '../types';
import { useFontSize } from '../contexts/FontSizeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useActivityTracking } from '../contexts/ActivityTrackingContext';

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
  const { activeActivity, stopActivity } = useActivityTracking();
  const styles = MainScreenStyles(getFontSize);

  const formatActivityTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const getActivityName = (type: string) => {
    switch (type) {
      case 'walk':
      case 'walking_tracker':
        return 'Walking';
      case 'exercise':
        return 'Exercising';
      case 'stairs_climbing':
        return 'Climbing Stairs';
      case 'sleep':
        return 'Sleeping';
      default:
        return 'Activity';
    }
  };

  const handleStopActivity = async () => {
    if (!activeActivity) return;
    
    // For sleep activities, show a note about saving with quality rating
    if (activeActivity.type === 'sleep') {
      Alert.alert(
        'Stop Sleep Tracking',
        'This will stop tracking. To save your sleep with quality rating, please go to the Activities screen.',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Stop Tracking', 
            onPress: async () => {
              await stopActivity();
            }
          }
        ]
      );
      return;
    }
    
    await stopActivity();
  };
  
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
        {activeActivity && (
          <View style={styles.activeActivityCard}>
            <View style={styles.activeActivityHeader}>
              <View style={styles.activeActivityInfo}>
                <Ionicons 
                  name={activeActivity.type === 'walking_tracker' || activeActivity.type === 'walk' ? 'walk' : activeActivity.type === 'sleep' ? 'moon' : 'fitness'} 
                  size={24} 
                  color="#FFFFFF" 
                />
                <View style={styles.activeActivityTextContainer}>
                  <Text style={styles.activeActivityTitle}>
                    Still {getActivityName(activeActivity.type)}?
                  </Text>
                  <Text style={styles.activeActivityDuration}>
                    {formatActivityTime(activeActivity.duration)}
                  </Text>
                </View>
              </View>
              <TouchableOpacity 
                style={styles.stopActivityButton}
                onPress={handleStopActivity}
              >
                <Ionicons name="stop" size={20} color="#FFFFFF" />
                <Text style={styles.stopActivityButtonText}>Stop</Text>
              </TouchableOpacity>
            </View>
            {(activeActivity.caloriesBurned > 0 || activeActivity.distance > 0) && (
              <View style={styles.activeActivityStats}>
                {activeActivity.caloriesBurned > 0 && (
                  <View style={styles.activeActivityStatItem}>
                    <Text style={styles.activeActivityStatValue}>
                      {Math.round(activeActivity.caloriesBurned)}
                    </Text>
                    <Text style={styles.activeActivityStatLabel}>calories</Text>
                  </View>
                )}
                {activeActivity.distance > 0 && (
                  <View style={styles.activeActivityStatItem}>
                    <Text style={styles.activeActivityStatValue}>
                      {activeActivity.distance.toFixed(2)}
                    </Text>
                    <Text style={styles.activeActivityStatLabel}>km</Text>
                  </View>
                )}
                {activeActivity.steps && activeActivity.steps > 0 && (
                  <View style={styles.activeActivityStatItem}>
                    <Text style={styles.activeActivityStatValue}>
                      {activeActivity.steps}
                    </Text>
                    <Text style={styles.activeActivityStatLabel}>steps</Text>
                  </View>
                )}
              </View>
            )}
          </View>
        )}
        
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
  activeActivityCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  activeActivityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  activeActivityInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  activeActivityTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  activeActivityTitle: {
    fontSize: getFontSize(18),
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  activeActivityDuration: {
    fontSize: getFontSize(16),
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '600',
  },
  stopActivityButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 59, 48, 0.9)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 6,
  },
  stopActivityButtonText: {
    color: '#FFFFFF',
    fontSize: getFontSize(14),
    fontWeight: '600',
  },
  activeActivityStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
  },
  activeActivityStatItem: {
    alignItems: 'center',
  },
  activeActivityStatValue: {
    fontSize: getFontSize(18),
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  activeActivityStatLabel: {
    fontSize: getFontSize(12),
    color: 'rgba(255, 255, 255, 0.8)',
    textTransform: 'uppercase',
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
