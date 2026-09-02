import { useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Stack } from 'expo-router';
import { QRScanner } from '../../components/QRScanner';
import { machineService } from '../../services/machineService';
import { ticketService } from '../../services/ticketService';
import { useAuthStore, AuthState } from '../../store/authStore';
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
  danger: '#DC2626',
  dangerLight: '#FEE2E2',
  warning: '#D97706',
  warningLight: '#FEF3C7',
  white: '#FFFFFF',
};

export default function BakimciScanMachineScreen() {
  const user = useAuthStore((state: AuthState) => state.user);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [scanning, setScanning] = useState(true);

  const scan = async (value: string) => {
    if (!scanning || !user) return;
    setScanning(false);

    try {
      const data = machineService.decodeMachineFromQR(value);

      if (data.companyId !== user.companyId) {
        throw new Error('Bu QR kod sizin işletmenize ait değil.');
      }

      const machine = await machineService.getMachineById(data.id);
      if (!machine) {
        throw new Error('Makine bulunamadı.');
      }

      const openTickets = await ticketService.getOpenTicketsByMachine(user.companyId, machine.id);

      if (openTickets.length === 0) {
        Alert.alert('Kayıt Yok', 'Bu makinede açık arıza bulunmuyor.', [
          { text: 'Tamam', onPress: () => setScanning(true) },
        ]);
        return;
      }

      setTickets(openTickets);
      setShowResults(true);
    } catch (error) {
      Alert.alert('QR Hatası', error instanceof Error ? error.message : 'QR kod okunamadı.', [
        { text: 'Tekrar Dene', onPress: () => setScanning(true) },
      ]);
    }
  };

  const renderUrgencyBadge = (urgency: Ticket['urgency']) => {
    const isUrgent = urgency === 'hat_durusu';
    return (
      <View style={[styles.badge, { backgroundColor: isUrgent ? palette.dangerLight : palette.warningLight }]}>
        <Text style={[styles.badgeText, { color: isUrgent ? palette.danger : palette.warning }]}>
          {isUrgent ? 'Hat Duruşu 🚨' : 'Normal'}
        </Text>
      </View>
    );
  };

  const renderStatusBadge = (status: Ticket['status']) => {
    const isInvestigating = status === 'inceleniyor';
    return (
      <View style={[styles.badge, { backgroundColor: isInvestigating ? palette.primaryLight : palette.warningLight }]}>
        <Text style={[styles.badgeText, { color: isInvestigating ? palette.primaryDark : palette.warning }]}>
          {isInvestigating ? 'İnceleniyor' : 'Açık'}
        </Text>
      </View>
    );
  };

  if (!user) return null;

  if (showResults) {
    return (
      <View style={styles.root}>
        <Stack.Screen options={{ headerShown: false }} />

        <SafeAreaView edges={['top']} style={styles.safeHeaderWrapper}>
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => {
                setShowResults(false);
                setScanning(true);
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.backArrow}>←</Text>
              <Text style={styles.backText}>Tekrar Tara</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Açık Arızalar</Text>
            <View style={{ width: 80 }} />
          </View>
        </SafeAreaView>

        <FlatList
          style={styles.container}
          contentContainerStyle={styles.content}
          data={tickets}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.ticketCard}
              onPress={() => router.replace({ pathname: '/(bakimci)/[id]', params: { id: item.id } })}
            >
              <View style={styles.ticketHeader}>
                <Text style={styles.ticketMachine} numberOfLines={1}>
                  {item.machineName}
                  {item.position ? ` / Poz. ${item.position}` : ''}
                </Text>
                {renderUrgencyBadge(item.urgency)}
              </View>

              <Text style={styles.ticketDescription} numberOfLines={2}>
                {item.description}
              </Text>

              <View style={styles.ticketFooter}>
                {renderStatusBadge(item.status)}
                <Text style={styles.ticketMeta}>Bildiren: {item.createdByName}</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <Stack.Screen options={{ headerShown: false }} />

      <SafeAreaView edges={['top']} style={styles.safeHeaderWrapper}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.7}>
            <Text style={styles.backArrow}>←</Text>
            <Text style={styles.backText}>Geri</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Makine QR Kodunu Okut</Text>
          <View style={{ width: 60 }} />
        </View>
      </SafeAreaView>

      <View style={styles.scannerWrapper}>
        <QRScanner
          onScanned={(value) => {
            void scan(value);
          }}
        />
      </View>
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
  header: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 52,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: { fontSize: 15, fontWeight: '700', color: palette.text },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.sm,
    backgroundColor: palette.primaryLight,
  },
  backArrow: { fontSize: 14, fontWeight: '800', color: palette.primaryDark, marginRight: 2 },
  backText: { fontSize: 12, fontWeight: '700', color: palette.primaryDark },
  scannerWrapper: { flex: 1 },
  container: { flex: 1 },
  content: { padding: spacing.md, gap: spacing.sm },
  ticketCard: {
    backgroundColor: palette.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: palette.border,
    gap: spacing.xs + 2,
    shadowColor: palette.primaryDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  ticketHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.xs },
  ticketMachine: { color: palette.text, fontSize: 15, fontWeight: '700', flex: 1 },
  ticketDescription: { color: palette.textSecondary, fontSize: 13, lineHeight: 18 },
  ticketFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xs,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: palette.border,
  },
  badge: { borderRadius: radius.sm, paddingHorizontal: spacing.sm, paddingVertical: 3 },
  badgeText: { fontSize: 10, fontWeight: '700' },
  ticketMeta: { color: palette.textMuted, fontSize: 11, fontWeight: '600' },
});