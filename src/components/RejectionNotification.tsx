import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface RejectionNotificationProps {
  visible: boolean;
  seniorEmail: string;
  onHide: () => void;
  duration?: number; // Duration in milliseconds
}

const RejectionNotification: React.FC<RejectionNotificationProps> = ({
  visible,
  seniorEmail,
  onHide,
  duration = 4000, // 4 seconds default
}) => {
  const slideAnim = useRef(new Animated.Value(-100)).current; // Start above screen
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Show animation
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto-hide after duration
      const timer = setTimeout(() => {
        hideNotification();
      }, duration);

      return () => clearTimeout(timer);
    } else {
      hideNotification();
    }
  }, [visible, duration]);

  const hideNotification = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onHide();
    });
  };

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY: slideAnim }],
          opacity: opacityAnim,
        },
      ]}
    >
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="close-circle" size={24} color="#FFFFFF" />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.title}>Request Rejected</Text>
          <Text style={styles.message}>
            {seniorEmail} has rejected your caregiver request
          </Text>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 20,
    left: 0,
    right: 0,
    zIndex: 9999,
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 10 : 0,
  },
  content: {
    backgroundColor: '#F44336', // Red color for rejection
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  iconContainer: {
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  message: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
  },
});

export default RejectionNotification;

