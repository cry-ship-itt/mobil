import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { TicketStatus } from '../types';

interface StatusBadgeProps {
  status: TicketStatus;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const getStyle = (st: TicketStatus) => {
    switch (st) {
      case 'acik':
        return { backgroundColor: '#ef4444', label: 'AÇIK' };
      case 'inceleniyor':
        return { backgroundColor: '#f59e0b', label: 'İNCELENİYOR' };
      case 'yapildi':
        return { backgroundColor: '#10b981', label: 'YAPILDI' };
      default:
        return { backgroundColor: '#6b7280', label: 'BİLİNMEYEN' };
    }
  };

  const style = getStyle(status);

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
