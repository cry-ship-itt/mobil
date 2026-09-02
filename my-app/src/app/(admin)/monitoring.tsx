import { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useAuthStore, AuthState } from '../../store/authStore';
import { ticketService } from '../../services/ticketService';
import { LogoutHeader } from '../../components/LogoutHeader';
import { StatusBadge } from '../../components/StatusBadge';
import { UrgencyBadge } from '../../components/UrgencyBadge';
import { Ticket } from '../../types';
import { colors, spacing } from '../../constants/theme';

function elapsed(ticket: Ticket, now: number) {
  const end = ticket.resolvedAt ?? now;
  const totalMinutes = Math.max(0, Math.floor((end - ticket.createdAt) / 60000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return hours > 0 ? `${hours} sa ${minutes} dk` : `${minutes} dk`;
}

export default function AdminMonitoringScreen() {
  const user = useAuthStore((state: AuthState) => state.user);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [now, setNow] = useState(Date.now());

  const companyId = user?.companyId ?? '';

  const load = useCallback(async () => {
    if (!companyId) return;
    try {
      setTickets(await ticketService.getCompanyTickets(companyId));
    } catch {
      Alert.alert('Hata', 'Arıza süreçleri yüklenemedi.');
    }
  }, [companyId]);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  useEffect(() => {
    if (!companyId) return;
    const channel = ticketService.subscribeToCompany(companyId, () => { void load(); });
    const timer = setInterval(() => setNow(Date.now()), 60000);
    return () => { ticketService.unsubscribe(channel); clearInterval(timer); };
  }, [load, companyId]);

  if (!user) return null;

  return (
    <View style={styles.root}>
      <LogoutHeader userName={user.name} subtitle="Admin - Süreç İzleme" />
      <FlatList
        data={tickets}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.top}>
              <Text style={styles.machine}>
                {item.machineName}
                {item.position ? ` / Pozisyon ${item.position}` : ''}
              </Text>
              <UrgencyBadge urgency={item.urgency} />
            </View>
            <Text style={styles.description}>{item.description}</Text>
            <Text style={styles.meta}>Bildiren: {item.createdByName}</Text>
            <View style={styles.bottom}>
              <StatusBadge status={item.status} />
              <Text style={styles.elapsed}>Geçen süre: {elapsed(item, now)}</Text>
            </View>
            {item.assignedTo ? (
              <Text style={styles.meta}>Bakımcı müdahale etti</Text>
            ) : (
              <Text style={styles.pending}>Henüz bakımcı atanmadı</Text>
            )}
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>Henüz arıza kaydı yok.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  list: { padding: spacing.lg, gap: spacing.md },
  card: { backgroundColor: colors.card, borderRadius: 8, padding: spacing.md, gap: spacing.sm },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.sm },
  machine: { color: colors.text, fontSize: 16, fontWeight: '800', flex: 1 },
  description: { color: colors.textSecondary },
  meta: { color: colors.textMuted, fontSize: 12 },
  pending: { color: colors.warning, fontSize: 12 },
  bottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  elapsed: { color: colors.text, fontSize: 12, fontWeight: '700' },
  empty: { color: colors.textMuted, textAlign: 'center', marginTop: spacing.xl },
});