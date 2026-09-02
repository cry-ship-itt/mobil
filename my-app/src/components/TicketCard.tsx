import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ticket } from '../types';
import { UrgencyBadge } from './UrgencyBadge';
import { StatusBadge } from './StatusBadge';

interface TicketCardProps {
  ticket: Ticket;
  onPress?: () => void;
}

export const TicketCard: React.FC<TicketCardProps> = ({ ticket, onPress }) => {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.header}>
        <View>
          <Text style={styles.machineName}>{ticket.machineName}</Text>
          {ticket.position && (
            <Text style={styles.position}>Pozisyon: {ticket.position}</Text>
          )}
        </View>
        <UrgencyBadge urgency={ticket.urgency} />
      </View>
      
      <Text style={styles.description} numberOfLines={2}>
        {ticket.description}
      </Text>
      
      <View style={styles.footer}>
        <Text style={styles.createdBy}>
          Rapor: {ticket.createdByName}
        </Text>
        <StatusBadge status={ticket.status} />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginVertical: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#2563eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  machineName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    flex: 1,
  },
  position: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  description: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  createdBy: {
    fontSize: 12,
    color: '#9ca3af',
  },
});
