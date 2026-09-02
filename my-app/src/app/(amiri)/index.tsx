import { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, RefreshControl, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Stack } from 'expo-router';
import { useAuthStore, AuthState } from '../../store/authStore';
import { supabase } from '../../utils/supabase';
import { spacing, radius } from '../../constants/theme';
import { ticketService } from '../../services/ticketService';
import { machineService } from '../../services/machineService';
import { Machine, Ticket } from '../../types';

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
  warning: '#D97706',
  warningLight: '#FEF3C7',
  success: '#059669',
  successLight: '#D1FAE5',
  white: '#FFFFFF',
};

export default function AmiriDashboard() {
  const user = useAuthStore((s: AuthState) => s.user);
  const logout = useAuthStore((s: AuthState) => s.logout);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadTickets = useCallback(async () => {
    if (!user) return;

    let query = supabase
      .from('tickets')
      .select('*')
      .eq('company_id', user.companyId);

    // Seviye 1: sadece kendi departmanı. Seviye 2: tüm departmanlar.
    if (user.authorityLevel === 'seviye_1' && user.departmentId) {
      query = query.eq('department_id', user.departmentId);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) {
      Alert.alert('Hata', 'Arızalar yüklenemedi.');
      return;
    }

    const mapped: Ticket[] = (data ?? []).map((row: any) => ({
      id: row.id,
      companyId: row.company_id,
      machineId: row.machine_id ?? undefined,
      machineName: row.machine_name,
      position: row.position ?? undefined,
      departmentId: row.department_id ?? undefined,
      positionId: row.position_id ?? undefined,
      categoryId: row.category_id ?? undefined,
      urgency: row.urgency,
      maintenanceType: row.maintenance_type,
      description: row.description,
      photoUrl: row.photo_url ?? undefined,
      status: row.status,
      createdBy: row.created_by,
      createdByName: row.created_by_name,
      assignedTo: row.assigned_to ?? undefined,
      resolutionNote: row.resolution_note ?? undefined,
      resolutionPhotoUrl: row.resolution_photo_url ?? undefined,
      createdAt: new Date(row.created_at).getTime(),
      resolvedAt: row.resolved_at ? new Date(row.resolved_at).getTime() : undefined,
    }));

    setTickets(mapped);
  }, [user]);

  useEffect(() => {
    if (!user) return;
    void loadTickets();
    void machineService.getMachinesByCompany(user.companyId).then(setMachines);
    const channel = ticketService.subscribeToCompany(user.companyId, () => {
      void loadTickets();
    });
    return () => ticketService.unsubscribe(channel);
  }, [loadTickets, user]);

  const refresh = async () => {
    setRefreshing(true);
    await loadTickets();
    setRefreshing(false);
  };

  const handleLogout = () => {
    Alert.alert('Çıkış Yap', 'Çıkış yapmak istediğinizden emin misiniz?', [
      { text: 'İptal', onPress: () => {} },
      {
        text: 'Evet',
        onPress: () => {
          logout();
        },
      },
    ]);
  };

  const renderStatusBadge = (status: Ticket['status']) => {
    let bg = palette.warningLight;
    let color = palette.warning;
    let label = 'Açık';

    if (status === 'inceleniyor') {
      bg = palette.primaryLight;
      color = palette.primaryDark;
      label = 'İnceleniyor';
    } else if (status === 'yapildi') {
      bg = palette.successLight;
      color = palette.success;
      label = 'Yapıldı';
    }

    return (
      <View style={[styles.statusBadge, { backgroundColor: bg }]}>
        <Text style={[styles.statusBadgeText, { color }]}>{label}</Text>
      </View>
    );
  };

  if (!user) return null;

  return (
    <View style={styles.root}>
      <Stack.Screen options={{ headerShown: false }} />

      <SafeAreaView edges={['top']} style={styles.safeHeaderWrapper}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.userAvatar}>
              <Text style={styles.userAvatarText}>{user.name.charAt(0).toUpperCase()}</Text>
            </View>
            <Text style={styles.userName} numberOfLines={1}>
              {user.name}
            </Text>
            <View style={styles.rolePill}>
              <Text style={styles.rolePillText}>Amir</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutButtonText}>Çıkış Yap</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <FlatList
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={palette.primary} />}
        ListHeaderComponent={
          <>
            <Text style={styles.sectionTitle}>Hızlı İşlemler</Text>

            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.actionCard}
              onPress={() => router.push('/(amiri)/scan-machine')}
            >
              <View style={styles.cardIcon}>
                <Text style={styles.cardIconText}>📷</Text>
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>QR ile Arıza Bildir</Text>
                <Text style={styles.cardDesc}>Makine QR kodunu okutarak hızlıca bildirim yapın</Text>
              </View>
              <Text style={styles.cardArrow}>›</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.actionCard}
              onPress={() => router.push('/(amiri)/report-ticket')}
            >
              <View style={[styles.cardIcon, { backgroundColor: palette.primaryLight }]}>
                <Text style={styles.cardIconText}>📋</Text>
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>Listeden Arıza Bildir</Text>
                <Text style={styles.cardDesc}>Makine ve pozisyon seçerek manuel bildirim yapın</Text>
              </View>
              <Text style={styles.cardArrow}>›</Text>
            </TouchableOpacity>

            <Text style={styles.sectionTitle}>Tanımlı Makineler</Text>
            {machines.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.empty}>Henüz makine tanımlanmadı.</Text>
              </View>
            ) : (
              machines.map((machine) => (
                <View key={machine.id} style={styles.machineCard}>
                  <View style={styles.machineInfo}>
                    <Text style={styles.machineName}>{machine.name}</Text>
                    <Text style={styles.machineMeta}>{machine.positions} pozisyon</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.machineAction}
                    onPress={() =>
                      router.push({
                        pathname: '/(amiri)/report-ticket',
                        params: { machineId: machine.id },
                      })
                    }
                  >
                    <Text style={styles.machineActionText}>Bildir</Text>
                  </TouchableOpacity>
                </View>
              ))
            )}

            <Text style={styles.sectionTitle}>Tüm Arızalar</Text>
          </>
        }
        data={tickets}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.ticketCard}
            onPress={() => router.push({ pathname: '/(amiri)/ticket-detail', params: { id: item.id } })}
          >
            <View style={styles.ticketHeader}>
              <Text style={styles.ticketMachine}>
                {item.machineName}
                {item.position ? ` / Pozisyon ${item.position}` : ''}
              </Text>
              {renderStatusBadge(item.status)}
            </View>
            <Text style={styles.ticketDescription} numberOfLines={2}>
              {item.description}
            </Text>
            <View style={styles.ticketFooter}>
              <Text style={styles.ticketTime}>Bildiren: {item.createdByName}</Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.empty}>Henüz arıza kaydı yok.</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.background },
  safeHeaderWrapper: { backgroundColor: palette.white, borderBottomWidth: 1, borderBottomColor: palette.border },
  header: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    minHeight: 52,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.xs + 2, marginRight: spacing.sm },
  userAvatar: { width: 34, height: 34, borderRadius: radius.md, backgroundColor: palette.primaryLight, justifyContent: 'center', alignItems: 'center' },
  userAvatarText: { fontSize: 14, fontWeight: '800', color: palette.primary },
  userName: { fontSize: 14, fontWeight: '700', color: palette.text, maxWidth: 140 },
  rolePill: { backgroundColor: palette.primaryLight, borderRadius: radius.sm, paddingHorizontal: spacing.xs, paddingVertical: 2 },
  rolePillText: { fontSize: 11, color: palette.primaryDark, fontWeight: '700' },
  logoutButton: { paddingVertical: 6, paddingHorizontal: spacing.sm + 2, borderRadius: radius.sm, backgroundColor: palette.dangerLight, justifyContent: 'center', alignItems: 'center' },
  logoutButtonText: { color: palette.danger, fontWeight: '700', fontSize: 12 },
  container: { flex: 1, paddingHorizontal: spacing.md },
  content: { paddingTop: spacing.xs, paddingBottom: spacing.xl, gap: spacing.xs },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: palette.text, marginTop: spacing.md, marginBottom: spacing.xs },
  actionCard: {
    backgroundColor: palette.card,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: palette.border,
    shadowColor: palette.primaryDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  cardIcon: { width: 36, height: 36, borderRadius: radius.sm, backgroundColor: palette.primaryLight, justifyContent: 'center', alignItems: 'center', marginRight: spacing.sm },
  cardIconText: { fontSize: 16 },
  cardContent: { flex: 1, justifyContent: 'center' },
  cardTitle: { fontSize: 13, fontWeight: '800', color: palette.text },
  cardDesc: { fontSize: 11, color: palette.textSecondary, marginTop: 2, lineHeight: 15 },
  cardArrow: { fontSize: 18, color: palette.primary, fontWeight: '700', marginLeft: spacing.xs },
  machineCard: {
    backgroundColor: palette.card,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: palette.border,
  },
  machineInfo: { flex: 1 },
  machineName: { color: palette.text, fontSize: 14, fontWeight: '700' },
  machineMeta: { color: palette.textSecondary, fontSize: 12, marginTop: 2 },
  machineAction: { backgroundColor: palette.primaryLight, borderRadius: radius.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
  machineActionText: { color: palette.primaryDark, fontSize: 12, fontWeight: '700' },
  ticketCard: {
    backgroundColor: palette.card,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.xs,
    borderWidth: 1,
    borderColor: palette.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  ticketHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.sm },
  ticketMachine: { color: palette.text, fontSize: 14, fontWeight: '700', flex: 1 },
  statusBadge: { borderRadius: radius.sm, paddingHorizontal: spacing.sm, paddingVertical: 3 },
  statusBadgeText: { fontSize: 11, fontWeight: '700' },
  ticketDescription: { color: palette.textSecondary, fontSize: 13, marginTop: spacing.xs, lineHeight: 18 },
  ticketFooter: { marginTop: spacing.xs, paddingTop: spacing.xs, borderTopWidth: 1, borderTopColor: palette.background },
  ticketTime: { color: palette.textMuted, fontSize: 11, fontWeight: '600' },
  emptyContainer: { backgroundColor: palette.card, borderRadius: radius.md, padding: spacing.lg, alignItems: 'center', marginBottom: spacing.xs, borderWidth: 1, borderColor: palette.border },
  empty: { color: palette.textSecondary, fontSize: 13 },
});