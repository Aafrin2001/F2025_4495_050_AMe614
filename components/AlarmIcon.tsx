import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface AlarmIconProps {
  size?: number;
}

export default function AlarmIcon({ size = 24 }: AlarmIconProps) {
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <View style={styles.bellContainer}>
        <Text style={[styles.bellIcon, { fontSize: size * 0.6 }]}>🔔</Text>
        <View style={styles.notificationDot} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellIcon: {
    textAlign: 'center',
    color: '#FFD700',
    fontWeight: 'bold',
  },
  notificationDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF4D4D',
  },
});
