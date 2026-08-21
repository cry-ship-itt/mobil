import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { UrgencyLevel } from '../types';

interface UrgencyBadgeProps {
  urgency: UrgencyLevel;
}

export const UrgencyBadge: React.FC<UrgencyBadgeProps> = ({ urgency }) => {
  const getStyle = (level: UrgencyLevel) => {
    switch (level) {
      case 'hat_durusu':
        return { backgroundColor: '#dc2626', label: 'HAT DURUŞ' };
      case 'normal':
      default:
        return { backgroundColor: '#059669', label: 'NORMAL' };
    }
  };

  const style = getStyle(urgency);

  return (
    <View style={[styles.badge, { backgroundColor: style.backgroundColor }]}>
      <Text style={styles.text}>{style.label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  text: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
});
