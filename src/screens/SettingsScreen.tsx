import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Modal,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useFontSize, FontSizeScale } from '../contexts/FontSizeContext';
import { useLanguage, Language } from '../contexts/LanguageContext';
import { Platform, KeyboardAvoidingView, TouchableWithoutFeedback } from 'react-native';

interface SettingsScreenProps {
  onBack: () => void;
}

interface SettingItem {
  id: string;
  title: string;
  description: string;
  icon: string;
  type: 'toggle' | 'navigation' | 'action';
  value?: boolean;
  onPress?: () => void;
}

const SettingsScreenComponent: React.FC<SettingsScreenProps> = ({ onBack }) => {
  const { fontSizeScale, setFontSizeScale, getFontSize } = useFontSize();
  const { language, setLanguage, t } = useLanguage();
  const styles = SettingsScreenStyles(getFontSize);
  const [settings, setSettings] = useState({
    // Accessibility Settings
    largeText: true,
    highContrast: false,
    voiceFeedback: true,
    hapticFeedback: true,
    
    // Notification Settings
    medicationReminders: true,
    healthCheckReminders: true,
    activityReminders: true,
    emergencyAlerts: true,
    quietHours: false,
    quietStartTime: '22:00',
    quietEndTime: '08:00',
    
    // Privacy Settings
    shareWithFamily: true,
    shareWithDoctor: false,
    locationTracking: false,
    dataBackup: true,
    
    // App Settings
    darkMode: false,
    autoLock: true,
    autoLockTime: 5, // minutes
    language: 'English',
    timeFormat: '12h',
  });

  const [showQuietHoursModal, setShowQuietHoursModal] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showTimeFormatModal, setShowTimeFormatModal] = useState(false);
  const [showAutoLockModal, setShowAutoLockModal] = useState(false);
  const [showFontSizeModal, setShowFontSizeModal] = useState(false);

  const handleToggle = (key: string) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key as keyof typeof prev]
    }));
  };

  const handleSelect = (key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleResetSettings = () => {
    Alert.alert(
      'Reset Settings',
      'Are you sure you want to reset all settings to default?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Reset', 
          style: 'destructive',
          onPress: () => {
            // Reset to default values
            setSettings({
              largeText: true,
              highContrast: false,
              voiceFeedback: true,
              hapticFeedback: true,
              medicationReminders: true,
              healthCheckReminders: true,
              activityReminders: true,
              emergencyAlerts: true,
              quietHours: false,
              quietStartTime: '22:00',
              quietEndTime: '08:00',
              shareWithFamily: true,
              shareWithDoctor: false,
              locationTracking: false,
              dataBackup: true,
              darkMode: false,
              autoLock: true,
              autoLockTime: 5,
              language: 'English',
              timeFormat: '12h',
            });
            Alert.alert('Success', 'Settings have been reset to default values.');
          }
        }
      ]
    );
  };

  const handleExportData = () => {
    Alert.alert(
      'Export Data',
      'Your health data will be exported to a secure file. This may take a few minutes.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Export', 
          onPress: () => Alert.alert('Export Started', 'Your data export has been initiated. You will receive a notification when it\'s ready.')
        }
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account and all data. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => Alert.alert('Account Deletion', 'Account deletion has been initiated. You will receive a confirmation email.')
        }
      ]
    );
  };

  const renderSettingItem = (item: SettingItem) => (
    <TouchableOpacity
      key={item.id}
      style={styles.settingItem}
      onPress={item.onPress}
      disabled={item.type === 'toggle'}
    >
      <View style={styles.settingLeft}>
        <View style={styles.settingIconContainer}>
          <Ionicons name={item.icon as any} size={24} color="#667eea" />
        </View>
        <View style={styles.settingContent}>
          <Text style={styles.settingTitle}>{item.title}</Text>
          <Text style={styles.settingDescription}>{item.description}</Text>
        </View>
      </View>
      
      <View style={styles.settingRight}>
        {item.type === 'toggle' && (
          <Switch
            value={item.value}
            onValueChange={() => handleToggle(item.id)}
            trackColor={{ false: 'rgba(255, 255, 255, 0.3)', true: '#667eea' }}
            thumbColor={item.value ? '#FFFFFF' : '#FFFFFF'}
          />
        )}
        {item.type === 'navigation' && (
          <Ionicons name="chevron-forward" size={20} color="rgba(255, 255, 255, 0.6)" />
        )}
      </View>
    </TouchableOpacity>
  );

  const renderSection = (title: string, items: SettingItem[]) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionContent}>
        {items.map(renderSettingItem)}
      </View>
    </View>
  );

  const getFontSizeLabel = (scale: FontSizeScale): string => {
    switch (scale) {
      case 'small': return 'Small (85%)';
      case 'medium': return 'Medium (100% - Default)';
      case 'large': return 'Large (125%)';
      case 'extraLarge': return 'Extra Large (150%)';
      default: return 'Medium (100%)';
    }
  };

  const accessibilitySettings: SettingItem[] = [
    {
      id: 'fontSize',
      title: t('settings.font_size'),
      description: getFontSizeLabel(fontSizeScale),
      icon: 'text-outline',
      type: 'navigation',
      onPress: () => setShowFontSizeModal(true),
    },
    {
      id: 'largeText',
      title: t('settings.large_text'),
      description: t('settings.large_text_desc'),
      icon: 'text-outline',
      type: 'toggle',
      value: settings.largeText,
    },
    {
      id: 'highContrast',
      title: t('settings.high_contrast'),
      description: t('settings.high_contrast_desc'),
      icon: 'contrast-outline',
      type: 'toggle',
      value: settings.highContrast,
    },
    {
      id: 'voiceFeedback',
      title: t('settings.voice_feedback'),
      description: t('settings.voice_feedback_desc'),
      icon: 'volume-high-outline',
      type: 'toggle',
      value: settings.voiceFeedback,
    },
    {
      id: 'hapticFeedback',
      title: t('settings.haptic_feedback'),
      description: t('settings.haptic_feedback_desc'),
      icon: 'phone-portrait-outline',
      type: 'toggle',
      value: settings.hapticFeedback,
    },
  ];

  const notificationSettings: SettingItem[] = [
    {
      id: 'medicationReminders',
      title: t('settings.medication_reminders'),
      description: t('settings.medication_reminders_desc'),
      icon: 'medical-outline',
      type: 'toggle',
      value: settings.medicationReminders,
    },
    {
      id: 'healthCheckReminders',
      title: t('settings.health_check_reminders'),
      description: t('settings.health_check_reminders_desc'),
      icon: 'heart-outline',
      type: 'toggle',
      value: settings.healthCheckReminders,
    },
    {
      id: 'activityReminders',
      title: t('settings.activity_reminders'),
      description: t('settings.activity_reminders_desc'),
      icon: 'fitness-outline',
      type: 'toggle',
      value: settings.activityReminders,
    },
    {
      id: 'emergencyAlerts',
      title: t('settings.emergency_alerts'),
      description: t('settings.emergency_alerts_desc'),
      icon: 'warning-outline',
      type: 'toggle',
      value: settings.emergencyAlerts,
    },
    {
      id: 'quietHours',
      title: t('settings.quiet_hours'),
      description: `${settings.quietStartTime} - ${settings.quietEndTime}`,
      icon: 'moon-outline',
      type: 'navigation',
      onPress: () => setShowQuietHoursModal(true),
    },
  ];

  const privacySettings: SettingItem[] = [
    {
      id: 'shareWithFamily',
      title: t('settings.share_family'),
      description: t('settings.share_family_desc'),
      icon: 'people-outline',
      type: 'toggle',
      value: settings.shareWithFamily,
    },
    {
      id: 'shareWithDoctor',
      title: t('settings.share_doctor'),
      description: t('settings.share_doctor_desc'),
      icon: 'person-outline',
      type: 'toggle',
      value: settings.shareWithDoctor,
    },
    {
      id: 'locationTracking',
      title: t('settings.location_tracking'),
      description: t('settings.location_tracking_desc'),
      icon: 'location-outline',
      type: 'toggle',
      value: settings.locationTracking,
    },
    {
      id: 'dataBackup',
      title: t('settings.data_backup'),
      description: t('settings.data_backup_desc'),
      icon: 'cloud-outline',
      type: 'toggle',
      value: settings.dataBackup,
    },
  ];

  const appSettings: SettingItem[] = [
    {
      id: 'language',
      title: t('settings.language'),
      description: language,
      icon: 'language-outline',
      type: 'navigation',
      onPress: () => setShowLanguageModal(true),
    },
    {
      id: 'timeFormat',
      title: 'Time Format',
      description: settings.timeFormat === '12h' ? '12-hour (AM/PM)' : '24-hour',
      icon: 'time-outline',
      type: 'navigation',
      onPress: () => setShowTimeFormatModal(true),
    },
    {
      id: 'autoLock',
      title: 'Auto Lock',
      description: settings.autoLock ? `${settings.autoLockTime} minutes` : 'Disabled',
      icon: 'lock-closed-outline',
      type: 'navigation',
      onPress: () => setShowAutoLockModal(true),
    },
  ];

  const dataSettings: SettingItem[] = [
    {
      id: 'exportData',
      title: t('settings.export_data'),
      description: t('settings.export_data_desc'),
      icon: 'download-outline',
      type: 'action',
      onPress: handleExportData,
    },
    {
      id: 'resetSettings',
      title: t('settings.reset_settings'),
      description: t('settings.reset_settings_desc'),
      icon: 'refresh-outline',
      type: 'action',
      onPress: handleResetSettings,
    },
    {
      id: 'deleteAccount',
      title: t('settings.delete_account'),
      description: t('settings.delete_account_desc'),
      icon: 'trash-outline',
      type: 'action',
      onPress: handleDeleteAccount,
    },
  ];

  return (
    <LinearGradient
      colors={['#667eea', '#764ba2']}
      style={styles.container}
    >
      <StatusBar style="light" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('settings.title')}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderSection(t('settings.accessibility'), accessibilitySettings)}
        {renderSection(t('settings.notifications'), notificationSettings)}
        {renderSection(t('settings.privacy_sharing'), privacySettings)}
        {renderSection(t('settings.app_preferences'), appSettings)}
        {renderSection(t('settings.data_account'), dataSettings)}
      </ScrollView>

      {/* Quiet Hours Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showQuietHoursModal}
        onRequestClose={() => setShowQuietHoursModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Quiet Hours</Text>
              <TouchableOpacity onPress={() => setShowQuietHoursModal(false)}>
                <Ionicons name="close" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalDescription}>
              Set times when you don't want to receive non-emergency notifications.
            </Text>
            
            <View style={styles.timeRow}>
              <View style={styles.timeContainer}>
                <Text style={styles.timeLabel}>Start Time</Text>
                <Text style={styles.timeValue}>{settings.quietStartTime}</Text>
              </View>
              <View style={styles.timeContainer}>
                <Text style={styles.timeLabel}>End Time</Text>
                <Text style={styles.timeValue}>{settings.quietEndTime}</Text>
              </View>
            </View>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => setShowQuietHoursModal(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={() => setShowQuietHoursModal(false)}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Language Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showLanguageModal}
        onRequestClose={() => setShowLanguageModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('settings.language')}</Text>
              <TouchableOpacity onPress={() => setShowLanguageModal(false)}>
                <Ionicons name="close" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            
            {(['English', 'Spanish', 'French', 'German', 'Chinese'] as Language[]).map((lang) => (
              <TouchableOpacity
                key={lang}
                style={styles.optionItem}
                onPress={() => {
                  setLanguage(lang);
                  handleSelect('language', lang);
                  setShowLanguageModal(false);
                }}
              >
                <Text style={styles.optionText}>{lang}</Text>
                {language === lang && (
                  <Ionicons name="checkmark" size={20} color="#667eea" />
                )}
              </TouchableOpacity>
            ))}
            
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setShowLanguageModal(false)}
            >
              <Text style={styles.modalButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Time Format Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showTimeFormatModal}
        onRequestClose={() => setShowTimeFormatModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Time Format</Text>
              <TouchableOpacity onPress={() => setShowTimeFormatModal(false)}>
                <Ionicons name="close" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            
            {[
              { value: '12h', label: '12-hour (AM/PM)' },
              { value: '24h', label: '24-hour' }
            ].map((format) => (
              <TouchableOpacity
                key={format.value}
                style={styles.optionItem}
                onPress={() => {
                  handleSelect('timeFormat', format.value);
                  setShowTimeFormatModal(false);
                }}
              >
                <Text style={styles.optionText}>{format.label}</Text>
                {settings.timeFormat === format.value && (
                  <Ionicons name="checkmark" size={20} color="#667eea" />
                )}
              </TouchableOpacity>
            ))}
            
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setShowTimeFormatModal(false)}
            >
              <Text style={styles.modalButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Auto Lock Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showAutoLockModal}
        onRequestClose={() => setShowAutoLockModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Auto Lock</Text>
              <TouchableOpacity onPress={() => setShowAutoLockModal(false)}>
                <Ionicons name="close" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalDescription}>
              Automatically lock the app after a period of inactivity.
            </Text>
            
            <View style={styles.toggleRow}>
              <Text style={styles.toggleLabel}>Enable Auto Lock</Text>
              <Switch
                value={settings.autoLock}
                onValueChange={(value) => handleSelect('autoLock', value)}
                trackColor={{ false: 'rgba(255, 255, 255, 0.3)', true: '#667eea' }}
                thumbColor="#FFFFFF"
              />
            </View>
            
            {settings.autoLock && (
              <View style={styles.timeOptions}>
                {[1, 5, 10, 15, 30].map((minutes) => (
                  <TouchableOpacity
                    key={minutes}
                    style={[
                      styles.timeOption,
                      settings.autoLockTime === minutes && styles.timeOptionSelected
                    ]}
                    onPress={() => handleSelect('autoLockTime', minutes)}
                  >
                    <Text style={[
                      styles.timeOptionText,
                      settings.autoLockTime === minutes && styles.timeOptionTextSelected
                    ]}>
                      {minutes} minutes
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => setShowAutoLockModal(false)}
              >
                <Text style={styles.modalButtonText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Font Size Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showFontSizeModal}
        onRequestClose={() => setShowFontSizeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('font_size.title')}</Text>
              <TouchableOpacity onPress={() => setShowFontSizeModal(false)}>
                <Ionicons name="close" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalDescription}>
              {t('font_size.desc')}
            </Text>
            
            {[
              { value: 'small', label: t('font_size.small'), desc: t('font_size.small_desc') },
              { value: 'medium', label: t('font_size.medium'), desc: t('font_size.medium_desc') },
              { value: 'large', label: t('font_size.large'), desc: t('font_size.large_desc') },
              { value: 'extraLarge', label: t('font_size.extra_large'), desc: t('font_size.extra_large_desc') }
            ].map((option) => (
              <TouchableOpacity
                key={option.value}
                style={styles.optionItem}
                onPress={() => {
                  setFontSizeScale(option.value as FontSizeScale);
                  setShowFontSizeModal(false);
                }}
              >
                <View style={styles.optionContent}>
                  <Text style={styles.optionText}>{option.label}</Text>
                  <Text style={styles.optionDesc}>{option.desc}</Text>
                </View>
                {fontSizeScale === option.value && (
                  <Ionicons name="checkmark" size={20} color="#667eea" />
                )}
              </TouchableOpacity>
            ))}
            
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setShowFontSizeModal(false)}
            >
              <Text style={styles.modalButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
};

const SettingsScreenStyles = (getFontSize: (base: number) => number) => StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: getFontSize(24),
    fontWeight: 'bold',
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'center',
    marginRight: 40,
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: getFontSize(20),
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 15,
    paddingLeft: 5,
  },
  sectionContent: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 15,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: getFontSize(16),
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 3,
  },
  settingDescription: {
    fontSize: getFontSize(14),
    color: 'rgba(255, 255, 255, 0.7)',
    lineHeight: getFontSize(18),
  },
  settingRight: {
    marginLeft: 15,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    padding: 30,
    width: '100%',
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
  },
  modalTitle: {
    fontSize: getFontSize(20),
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  modalDescription: {
    fontSize: getFontSize(14),
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginBottom: 20,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  timeContainer: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 10,
  },
  timeLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 8,
  },
  timeValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 10,
  },
  optionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  optionContent: {
    flex: 1,
  },
  optionText: {
    fontSize: getFontSize(16),
    color: '#FFFFFF',
    fontWeight: '500',
  },
  optionDesc: {
    fontSize: getFontSize(12),
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 2,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    marginBottom: 20,
  },
  toggleLabel: {
    fontSize: getFontSize(16),
    color: '#FFFFFF',
  },
  timeOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  timeOption: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  timeOptionSelected: {
    backgroundColor: '#667eea',
  },
  timeOptionText: {
    fontSize: getFontSize(14),
    color: '#FFFFFF',
  },
  timeOptionTextSelected: {
    fontWeight: '600',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    padding: 15,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    marginHorizontal: 5,
  },
  saveButton: {
    backgroundColor: '#FFFFFF',
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontSize: getFontSize(16),
    fontWeight: '600',
  },
  saveButtonText: {
    color: '#667eea',
    fontSize: getFontSize(16),
    fontWeight: '600',
  },
});

export default SettingsScreenComponent;
