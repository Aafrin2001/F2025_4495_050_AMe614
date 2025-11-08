import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type NotificationType = 'approved' | 'rejected';

interface RejectionNotificationProps {
  visible: boolean;
  type: NotificationType;
  seniorEmail: string;
  onHide: () => void;
  duration?: number; // Duration in milliseconds
}

const RejectionNotification: React.FC<RejectionNotificationProps> = ({
  visible,
  type,
  seniorEmail,
  onHide,
  duration = 4000, // 4 seconds default
}) => {
  const slideAnim = useRef(new Animated.Value(-100)).current; // Start above screen
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const hasBeenVisibleRef = useRef(false);

  useEffect(() => {
    console.log('📱 RejectionNotification useEffect:', { visible, type, seniorEmail, hasBeenVisible: hasBeenVisibleRef.current });
    
    if (visible) {
      hasBeenVisibleRef.current = true;
      console.log('📱 Showing notification animation');
      
      // Clear any existing timer
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      
      // Reset animation values first
      slideAnim.setValue(-100);
      opacityAnim.setValue(0);
      
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
      ]).start(() => {
        console.log('📱 Notification animation completed');
      });

      // Auto-hide after duration
      timerRef.current = setTimeout(() => {
        console.log('📱 Auto-hiding notification after', duration, 'ms');
        timerRef.current = null;
        hideNotification();
      }, duration);

      return () => {
        if (timerRef.current) {
          console.log('📱 Cleaning up notification timer (early cleanup)');
          clearTimeout(timerRef.current);
          timerRef.current = null;
        }
      };
    } else if (hasBeenVisibleRef.current) {
      // Only hide if we've been visible before (avoid hiding on initial mount)
      // Also check if we have an active timer - if so, don't hide yet (let timer handle it)
      if (timerRef.current) {
        console.log('📱 visible=false but timer is still active, ignoring hide request');
        return;
      }
      console.log('📱 Hiding notification (visible changed to false, no active timer)');
      hideNotification();
    }
    // Only depend on visible and duration - don't re-run when type/email change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, duration]);

  const hideNotification = () => {
    // Clear timer if it exists
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    
    console.log('📱 Starting hide animation');
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
      console.log('📱 Hide animation completed, calling onHide');
      onHide();
    });
  };

  if (!visible) return null;

  const isApproved = type === 'approved';
  const backgroundColor = isApproved ? '#4CAF50' : '#F44336'; // Green for approved, Red for rejected
  const iconName = isApproved ? 'checkmark-circle' : 'close-circle';
  const title = isApproved ? 'Request Approved!' : 'Request Rejected';
  const message = isApproved 
    ? `${seniorEmail} has approved your caregiver request`
    : `${seniorEmail} has rejected your caregiver request`;

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
      <View style={[styles.content, { backgroundColor }]}>
        <View style={styles.iconContainer}>
          <Ionicons name={iconName} size={24} color="#FFFFFF" />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
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
    // backgroundColor is set dynamically based on type
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

