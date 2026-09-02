import { useCallback, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useFocusEffect, router, Stack } from 'expo-router';
import { ticketService } from '../../services/ticketService';
import { UrgencyBadge } from '../../components/UrgencyBadge';
import { StatusBadge } from '../../components/StatusBadge';
import { Ticket } from '../../types';
import { spacing, radius } from '../../constants/theme';

const palette = {
  background: '#F7F5FB',
  card: '#FFFFFF',
  border: '#EDE9F7',
  primary: '#7C3AED',
  primaryLight: '#EDE4FC',
  primaryDark: '#5B21B6',
  text: '#1F1B2E',
  textSecondary: '#7A7488',
  textMuted: '#9CA3AF',
};

export default function AmiriTicketDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [ticket, setTicket] = useState<Ticket | null>(null);

  useFocusEffect(
    useCallback(() => {
      ticketService.getTicketById(id).then((t) => setTicket(t ?? null));
    }, [id])
  );

  return (
    <View style={styles.root}>
      <Stack.Screen options={{ headerShown: false }} />

      <SafeAreaView edges={['top']} style={styles.safeHeaderWrapper}>
        <View style={styles.headerBar}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.7}>
            <Text style={styles.backArrow}>←</Text>
            <Text style={styles.backText}>Geri</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Arıza Detayı</Text>
          <View style={{ width: 60 }} />
        </View>
      </SafeAreaView>

      {!ticket ? (
        <View style={styles.container}>
          <Text style={styles.empty}>Kayıt bulunamadı veya yükleniyor...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.container}>
          <View style={styles.detailCard}>
            <View style={styles.badgeRow}>
              <UrgencyBadge urgency={ticket.urgency} />
              <StatusBadge status={ticket.status} />
            </View>

            <Text style={styles.machine}>
              {ticket.machineName}
              {ticket.position ? ` / Pozisyon ${ticket.position}` : ''}
            </Text>
            <Text style={styles.description}>{ticket.description}</Text>

            <View style={styles.metaContainer}>
              <Text style={styles.metaLabel}>Bildiren Personel</Text>
              <Text style={styles.metaValue}>{ticket.createdByName}</Text>
            </View>

            {ticket.status === 'yapildi' && (
              <View style={styles.resolutionBox}>
                <Text style={styles.label}>Müdahale Notu</Text>
                <View style={styles.resolutionNoteCard}>
                  <Text style={styles.resolutionText}>{ticket.resolutionNote || 'Not belirtilmemiş.'}</Text>
                </View>
              </View>
            )}

            {ticket.status !== 'yapildi' && !ticket.assignedTo && (
              <Text style={styles.pending}>Henüz bakımcı atanmadı.</Text>
            )}
            {ticket.status !== 'yapildi' && ticket.assignedTo && (
              <Text style={styles.pending}>Bakımcı müdahale ediyor.</Text>
            )}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.background },
  safeHeaderWrapper: { backgroundColor: palette.card, borderBottomWidth: 1, borderBottomColor: palette.border },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs + 2,
    minHeight: 52,
  },
  backButton: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, paddingHorizontal: spacing.sm, borderRadius: radius.sm, backgroundColor: palette.primaryLight },
  backArrow: { fontSize: 15, fontWeight: '800', color: palette.primaryDark, marginRight: 2 },
  backText: { fontSize: 12, fontWeight: '700', color: palette.primaryDark },
  headerTitle: { fontSize: 15, fontWeight: '700', color: palette.text },
  container: { padding: spacing.md, backgroundColor: palette.background, flexGrow: 1 },
  detailCard: {
    backgroundColor: palette.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: palette.border,
  },
  badgeRow: { flexDirection: 'row', gap: spacing.xs + 2, marginBottom: spacing.sm },
  machine: { color: palette.text, fontSize: 18, fontWeight: '800', marginBottom: spacing.xs },
  description: { color: palette.textSecondary, fontSize: 14, marginBottom: spacing.md, lineHeight: 20 },
  metaContainer: { paddingTop: spacing.xs + 2, borderTopWidth: 1, borderTopColor: palette.border, marginBottom: spacing.md },
  metaLabel: { fontSize: 11, fontWeight: '600', color: palette.textMuted, marginBottom: 2 },
  metaValue: { fontSize: 13, fontWeight: '700', color: palette.text },
  empty: { color: palette.textSecondary, textAlign: 'center', marginTop: spacing.xl },
  label: { color: palette.text, fontSize: 13, fontWeight: '700', marginBottom: spacing.xs },
  resolutionBox: { marginTop: spacing.xs, gap: spacing.sm },
  resolutionNoteCard: { backgroundColor: palette.primaryLight, borderRadius: radius.md, padding: spacing.sm + 2 },
  resolutionText: { color: palette.primaryDark, fontSize: 13, lineHeight: 18, fontWeight: '600' },
  pending: { color: palette.textMuted, fontSize: 12, fontStyle: 'italic', marginTop: spacing.xs },
});