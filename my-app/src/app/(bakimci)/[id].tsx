import { useCallback, useState } from 'react';
import { View, Text, TextInput, ScrollView, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useFocusEffect, router, Stack } from 'expo-router';
import { useAuthStore, AuthState } from '../../store/authStore';
import { ticketService } from '../../services/ticketService';
import { PrimaryButton } from '../../components/PrimaryButton';
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
  secondary: '#A78BFA',
  text: '#1F1B2E',
  textSecondary: '#7A7488',
  textMuted: '#9CA3AF',
  danger: '#DC2626',
  dangerLight: '#FEE2E2',
  white: '#FFFFFF',
};

export default function TicketDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const user = useAuthStore((s: AuthState) => s.user);
  const logout = useAuthStore((s: AuthState) => s.logout);
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [resolutionNote, setResolutionNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useFocusEffect(
    useCallback(() => {
      ticketService.getTicketById(id).then((t) => setTicket(t ?? null));
    }, [id])
  );

  const handleLogout = () => {
    Alert.alert('Çıkış Yap', 'Hesabınızdan çıkış yapmak istediğinize emin misiniz?', [
      { text: 'İptal', style: 'cancel' },
      { text: 'Çıkış Yap', style: 'destructive', onPress: () => logout() },
    ]);
  };

  const handleStart = async () => {
    if (!user || !ticket) return;
    setSubmitting(true);
    try {
      await ticketService.startInvestigating(ticket.id, user.id);
      const updated = await ticketService.getTicketById(ticket.id);
      setTicket(updated ?? null);
    } catch (error) {
      Alert.alert('Hata', 'İşlem başlatılamadı.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleComplete = async () => {
    if (!ticket) return;
    if (!resolutionNote.trim()) {
      Alert.alert('Eksik bilgi', 'Müdahale açıklaması zorunludur.');
      return;
    }
    setSubmitting(true);
    try {
      await ticketService.completeTicket(ticket.id, resolutionNote.trim());
      Alert.alert('Tamamlandı', 'Arıza başarıyla kapatıldı.', [
        { text: 'Tamam', onPress: () => router.back() },
      ]);
    } catch (error) {
      Alert.alert('Hata', 'Arıza kapatılırken bir sorun oluştu.');
      setSubmitting(false);
    }
  };

  if (!user) return null;

  if (!ticket) {
    return (
      <SafeAreaView edges={['top']} style={styles.root}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.container}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.7}>
            <Text style={styles.backArrow}>←</Text>
            <Text style={styles.backText}>Geri</Text>
          </TouchableOpacity>
          <Text style={styles.empty}>Kayıt bulunamadı veya yükleniyor...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.root}>
      <Stack.Screen options={{ headerShown: false }} />

      <SafeAreaView edges={['top']} style={styles.safeHeaderWrapper}>
        <View style={styles.headerBar}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.7}>
            <Text style={styles.backArrow}>←</Text>
            <Text style={styles.backText}>Geri</Text>
          </TouchableOpacity>

          <View style={styles.userSection}>
            <View style={styles.userAvatar}>
              <Text style={styles.userAvatarText}>{user.name.charAt(0).toUpperCase()}</Text>
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName} numberOfLines={1}>{user.name}</Text>
              <Text style={styles.userSubtitle}>Bakımcı</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutText}>Çıkış Yap</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.detailCard}>
          <View style={styles.badgeRow}>
            <UrgencyBadge urgency={ticket.urgency} />
            <StatusBadge status={ticket.status} />
          </View>

          <Text style={styles.machine}>{ticket.machineName}</Text>
          <Text style={styles.description}>{ticket.description}</Text>

          <View style={styles.metaContainer}>
            <Text style={styles.metaLabel}>Bildiren Personel</Text>
            <Text style={styles.metaValue}>{ticket.createdByName}</Text>
          </View>

          {ticket.status === 'acik' && (
            <View style={styles.actionContainer}>
              <PrimaryButton label="İncelemeyi Başlat" onPress={handleStart} loading={submitting} />
            </View>
          )}

          {ticket.status === 'inceleniyor' && (
            <View style={styles.resolutionBox}>
              <Text style={styles.label}>Müdahale Açıklaması</Text>
              <TextInput
                value={resolutionNote}
                onChangeText={setResolutionNote}
                placeholder="Yapılan işlemi açıklayın..."
                placeholderTextColor={palette.textMuted}
                multiline
                numberOfLines={4}
                style={styles.textArea}
              />
              <PrimaryButton label="Yapıldı Olarak Kapat" onPress={handleComplete} loading={submitting} />
            </View>
          )}

          {ticket.status === 'yapildi' && (
            <View style={styles.resolutionBox}>
              <Text style={styles.label}>Müdahale Notu</Text>
              <View style={styles.resolutionNoteCard}>
                <Text style={styles.resolutionText}>{ticket.resolutionNote || 'Not belirtilmemiş.'}</Text>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.background },
  safeHeaderWrapper: {
    backgroundColor: palette.card,
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs + 2,
    minHeight: 52,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.sm,
    backgroundColor: palette.primaryLight,
  },
  backArrow: { fontSize: 15, fontWeight: '800', color: palette.primaryDark, marginRight: 2 },
  backText: { fontSize: 12, fontWeight: '700', color: palette.primaryDark },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
    flex: 1,
    marginLeft: spacing.xs + 2,
  },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: radius.md,
    backgroundColor: palette.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userAvatarText: { fontSize: 13, fontWeight: '800', color: palette.primary },
  userInfo: { justifyContent: 'center' },
  userName: { fontSize: 13, fontWeight: '700', color: palette.text },
  userSubtitle: { fontSize: 10, fontWeight: '600', color: palette.textSecondary },
  logoutButton: {
    paddingVertical: 6,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.sm,
    backgroundColor: palette.dangerLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutText: { fontSize: 11, fontWeight: '700', color: palette.danger },
  container: { padding: spacing.md, backgroundColor: palette.background, flexGrow: 1 },
  detailCard: {
    backgroundColor: palette.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: palette.border,
    shadowColor: palette.primaryDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  badgeRow: { flexDirection: 'row', gap: spacing.xs + 2, marginBottom: spacing.sm },
  machine: { color: palette.text, fontSize: 18, fontWeight: '800', marginBottom: spacing.xs },
  description: { color: palette.textSecondary, fontSize: 14, marginBottom: spacing.md, lineHeight: 20 },
  metaContainer: {
    paddingTop: spacing.xs + 2,
    borderTopWidth: 1,
    borderTopColor: palette.border,
    marginBottom: spacing.md,
  },
  metaLabel: { fontSize: 11, fontWeight: '600', color: palette.textMuted, marginBottom: 2 },
  metaValue: { fontSize: 13, fontWeight: '700', color: palette.text },
  empty: { color: palette.textSecondary, textAlign: 'center', marginTop: spacing.xl },
  actionContainer: { marginTop: spacing.xs },
  label: { color: palette.text, fontSize: 13, fontWeight: '700', marginBottom: spacing.xs },
  resolutionBox: { marginTop: spacing.xs, gap: spacing.sm },
  textArea: {
    backgroundColor: palette.background,
    color: palette.text,
    borderRadius: radius.md,
    padding: spacing.sm + 2,
    fontSize: 14,
    minHeight: 100,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: palette.border,
  },
  resolutionNoteCard: {
    backgroundColor: palette.primaryLight,
    borderRadius: radius.md,
    padding: spacing.sm + 2,
  },
  resolutionText: { color: palette.primaryDark, fontSize: 13, lineHeight: 18, fontWeight: '600' },
});