import { useCallback, useState } from 'react';
import { View, Text, TextInput, ScrollView, StyleSheet, Alert } from 'react-native';
import { useLocalSearchParams, useFocusEffect, router } from 'expo-router';
import { useAuthStore, AuthState } from '../../store/authStore';
import { ticketService } from '../../services/ticketService';
import { PrimaryButton } from '../../components/PrimaryButton';
import { LogoutHeader } from '../../components/LogoutHeader';
import { UrgencyBadge } from '../../components/UrgencyBadge';
import { StatusBadge } from '../../components/StatusBadge';
import { Ticket } from '../../types';
import { colors, spacing, radius } from '../../constants/theme';

export default function TicketDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const user = useAuthStore((s: AuthState) => s.user)!;
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [resolutionNote, setResolutionNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useFocusEffect(
    useCallback(() => {
      ticketService.getTicketById(id).then((t) => setTicket(t ?? null));
    }, [id])
  );

  if (!ticket) {
    return (
      <View style={styles.container}>
        <Text style={styles.empty}>Kayıt bulunamadı.</Text>
      </View>
    );
  }

  const handleStart = async () => {
    setSubmitting(true);
    await ticketService.startInvestigating(ticket.id, user.id);
    const updated = await ticketService.getTicketById(ticket.id);
    setTicket(updated ?? null);
    setSubmitting(false);
  };

  const handleComplete = async () => {
    if (!resolutionNote.trim()) {
      Alert.alert('Eksik bilgi', 'Müdahale açıklaması zorunludur.');
      return;
    }
    setSubmitting(true);
    await ticketService.completeTicket(ticket.id, resolutionNote.trim());
    setSubmitting(false);
    Alert.alert('Tamamlandı', 'Arıza kapatıldı.', [
      { text: 'Tamam', onPress: () => router.back() },
    ]);
  };

  return (
    <View style={styles.root}>
      <LogoutHeader userName={user.name} subtitle="Bakımcı" />
      <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.badgeRow}>
        <UrgencyBadge urgency={ticket.urgency} />
        <StatusBadge status={ticket.status} />
      </View>

      <Text style={styles.machine}>{ticket.machineName}</Text>
      <Text style={styles.description}>{ticket.description}</Text>
      <Text style={styles.meta}>Bildiren: {ticket.createdByName}</Text>

      {ticket.status === 'acik' && (
        <PrimaryButton label="İncelemeyi Başlat" onPress={handleStart} loading={submitting} />
      )}

      {ticket.status === 'inceleniyor' && (
        <View style={styles.resolutionBox}>
          <Text style={styles.label}>Müdahale Açıklaması</Text>
          <TextInput
            value={resolutionNote}
            onChangeText={setResolutionNote}
            placeholder="Yapılan işlemi açıklayın..."
            placeholderTextColor={colors.textMuted}
            multiline
            numberOfLines={4}
            style={styles.textArea}
          />
          {/* Fotoğraf ekleme: Firebase Storage entegrasyonunda eklenecek */}
          <PrimaryButton label="Yapıldı Olarak Kapat" onPress={handleComplete} loading={submitting} />
        </View>
      )}

      {ticket.status === 'yapildi' && (
        <View style={styles.resolutionBox}>
          <Text style={styles.label}>Müdahale Notu</Text>
          <Text style={styles.description}>{ticket.resolutionNote}</Text>
        </View>
      )}
    </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  container: { padding: spacing.lg, backgroundColor: colors.background, flexGrow: 1 },
  badgeRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  machine: { color: colors.text, fontSize: 20, fontWeight: '800', marginBottom: spacing.sm },
  description: { color: colors.textMuted, fontSize: 15, marginBottom: spacing.sm, lineHeight: 22 },
  meta: { color: colors.textMuted, fontSize: 12, marginBottom: spacing.lg },
  empty: { color: colors.textMuted, textAlign: 'center', marginTop: spacing.xl },
  label: { color: colors.textMuted, fontSize: 13, fontWeight: '600', marginBottom: spacing.xs },
  resolutionBox: { marginTop: spacing.lg, gap: spacing.md },
  textArea: {
    backgroundColor: colors.surface,
    color: colors.text,
    borderRadius: radius.md,
    padding: spacing.md,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: colors.border,
  },
});