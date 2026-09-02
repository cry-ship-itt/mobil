import { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect, Stack } from 'expo-router';
import { useAuthStore, AuthState } from '../../store/authStore';
import { supabase } from '../../utils/supabase';
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
  success: '#059669',
  successLight: '#D1FAE5',
  white: '#FFFFFF',
};

export default function BakimciDashboard() {
  const user = useAuthStore((s: AuthState) => s.user);
  const logout = useAuthStore((s: AuthState) => s.logout);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;

    try {
      let query = supabase
        .from('tickets')
        .select('*')
        .eq('company_id', user.companyId)
        .neq('status', 'yapildi');

      // Seviye 1: Sadece bağlı olduğu departman. Seviye 2: Tüm departmanlar.
      if (user.authorityLevel === 'seviye_1' && user.departmentId) {
        query = query.eq('department_id', user.departmentId);
      }

      // Bakım Türü: 'genel' değilse branşına göre filtrele.
      if (user.maintenanceType && user.maintenanceType !== 'genel') {
        query = query.eq('maintenance_type', user.maintenanceType);
      }

      const { data, error } = await query
        .order('urgency', { ascending: true })
        .order('created_at', { ascending: false });

      if (error) throw error;

      const mapped: Ticket[] = (data ?? []).map((row) => ({
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
    } catch (error) {
      console.error('Biletler çekilirken hata oluştu:', error);
      Alert.alert('Hata', 'Arızalar yüklenirken bir sorun oluştu.');
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  const refresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const handleLogout = () => {
    Alert.alert('Çıkış Yap', 'Çıkış yapmak istediğinizden emin misiniz?', [
      { text: 'İptal', style: 'cancel' },
      { text: 'Çıkış Yap', style: 'destructive', onPress: () => logout() },
    ]);
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

  const renderTypeBadge = (type?: string) => {
    if (!type) return null;
    const isElectric = type === 'elektrik';
    return (
      <View style={[styles.badge, { backgroundColor: isElectric ? '#E0F2FE' : '#F3E8FF' }]}>
        <Text style={[styles.badgeText, { color: isElectric ? '#0369A1' : '#6B21A8' }]}>
          {isElectric ? 'Elektrik' : 'Mekanik'}
        </Text>
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
              <Text style={styles.userAvatarText}>{user.name?.charAt(0).toUpperCase() || 'B'}</Text>
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName} numberOfLines={1}>{user.name}</Text>
              <Text style={styles.userSubtitle} numberOfLines={1}>
                Bakım Ekibi
                {user.authorityLevel === 'seviye_2' ? ' • Sev. 2' : ' • Sev. 1'}
                {user.maintenanceType && user.maintenanceType !== 'genel'
                  ? ` • ${user.maintenanceType === 'elektrik' ? 'Elektrik' : 'Mekanik'}`
                  : ' • Genel'}
              </Text>
            </View>
          </View>

          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.7}>
            <Text style={styles.logoutButtonText}>Çıkış</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <FlatList
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={refresh} 
            tintColor={palette.primary} 
            colors={[palette.primary]} 
          />
        }
        data={tickets}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.ticketCard}
            onPress={() => router.push({ pathname: '/(bakimci)/[id]', params: { id: item.id } })}
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
              <View style={styles.badgeGroup}>
                {renderStatusBadge(item.status)}
                {renderTypeBadge(item.maintenanceType)}
              </View>
              <Text style={styles.ticketMeta}>Bildiren: {item.createdByName}</Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>Açık Arıza Yok</Text>
            <Text style={styles.emptySubtitle}>Sorumluluk alanınızda şu anda müdahale bekleyen kayıt bulunmuyor.</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.background },
  safeHeaderWrapper: { 
    backgroundColor: palette.white, 
    borderBottomWidth: 1, 
    borderBottomColor: palette.border 
  },
  header: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 56,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.xs + 2, marginRight: spacing.sm },
  userAvatar: { 
    width: 36, 
    height: 36, 
    borderRadius: radius.md, 
    backgroundColor: palette.primaryLight, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  userAvatarText: { fontSize: 14, fontWeight: '800', color: palette.primary },
  userInfo: { flex: 1 },
  userName: { fontSize: 14, fontWeight: '700', color: palette.text },
  userSubtitle: { fontSize: 11, color: palette.textSecondary, marginTop: 1, fontWeight: '500' },
  logoutButton: { 
    paddingVertical: 6, 
    paddingHorizontal: spacing.sm, 
    borderRadius: radius.sm, 
    backgroundColor: palette.dangerLight 
  },
  logoutButtonText: { color: palette.danger, fontWeight: '700', fontSize: 11 },
  container: { flex: 1 },
  content: { padding: spacing.md, paddingBottom: spacing.xl, gap: spacing.sm },
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
  badgeGroup: { flexDirection: 'row', gap: spacing.xs },
  badge: { borderRadius: radius.sm, paddingHorizontal: spacing.sm, paddingVertical: 3 },
  badgeText: { fontSize: 10, fontWeight: '700' },
  ticketMeta: { color: palette.textMuted, fontSize: 11, fontWeight: '600' },
  emptyContainer: { 
    backgroundColor: palette.card, 
    borderRadius: radius.lg, 
    padding: spacing.xl, 
    alignItems: 'center', 
    marginTop: spacing.lg, 
    borderWidth: 1, 
    borderColor: palette.border 
  },
  emptyTitle: { color: palette.text, fontSize: 15, fontWeight: '700', marginBottom: 4 },
  emptySubtitle: { color: palette.textSecondary, fontSize: 12, textAlign: 'center' },
});