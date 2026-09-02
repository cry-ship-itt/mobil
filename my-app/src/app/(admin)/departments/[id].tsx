import { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, FlatList, Pressable, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { useAuthStore } from '../../../store/authStore';
import { machineService } from '../../../services/machineService';
import { ticketService } from '../../../services/ticketService';
import { supabase } from '../../../utils/supabase';
import { spacing, radius } from '../../../constants/theme';
import { Machine, MaintenanceType, Ticket, UserRole } from '../../../types';

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
  warning: '#D97706',
  warningLight: '#FEF3C7',
  success: '#059669',
  successLight: '#D1FAE5',
  white: '#FFFFFF',
};

type AuthorityLevel = 'seviye_1' | 'seviye_2';

interface DepartmentOption {
  id: string;
  name: string;
}

interface GeneratedCode {
  code: string;
  role: UserRole;
  createdAt: number;
}

function maskCompanyId(id?: string) {
  if (!id) return '----';
  if (id.length <= 4) return '••••';
  return `••••${id.slice(-4)}`;
}

function calculateDuration(startMs?: string | Date | number, endMs?: string | Date | number) {
  if (!startMs) return '-';
  const start = new Date(startMs).getTime();
  const end = endMs ? new Date(endMs).getTime() : Date.now();
  const diffMs = end - start;
  if (diffMs < 0) return '0 dk';
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 60) return `${diffMins} dk`;
  const diffHours = Math.floor(diffMins / 60);
  const remainingMins = diffMins % 60;
  if (diffHours < 24) {
    return remainingMins > 0 ? `${diffHours} sa ${remainingMins} dk` : `${diffHours} sa`;
  }
  const diffDays = Math.floor(diffHours / 24);
  const remainingHours = diffHours % 24;
  return remainingHours > 0 ? `${diffDays} gün ${remainingHours} sa` : `${diffDays} gün`;
}

export default function AdminDashboard() {
  const { user, generateInviteCode, logout } = useAuthStore();
  const [generatedCodes, setGeneratedCodes] = useState<GeneratedCode[]>([]);
  const [selectedRole, setSelectedRole] = useState<UserRole>('amiri');
  const [departments, setDepartments] = useState<DepartmentOption[]>([]);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string | null>(null);
  const [selectedMaintenanceType, setSelectedMaintenanceType] = useState<MaintenanceType>('genel');
  const [selectedAuthorityLevel, setSelectedAuthorityLevel] = useState<AuthorityLevel>('seviye_1');
  const [machines, setMachines] = useState<Machine[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const companyId = user?.companyId ?? '';

  const loadData = useCallback(async () => {
    if (!companyId) return;
    const [machineList, ticketList, departmentsRes] = await Promise.all([
      machineService.getMachinesByCompany(companyId),
      ticketService.getCompanyTickets(companyId),
      supabase.from('departments').select('id, name').eq('company_id', companyId).order('name'),
    ]);
    setMachines(machineList);
    setTickets(ticketList);
    if (!departmentsRes.error) {
      setDepartments((departmentsRes.data as DepartmentOption[]) ?? []);
    }
  }, [companyId]);

  useEffect(() => {
    if (!companyId) return;
    void loadData();
    const channel = ticketService.subscribeToCompany(companyId, () => {
      void loadData();
    });
    return () => ticketService.unsubscribe(channel);
  }, [loadData, companyId]);

  const refresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleGenerateCode = async () => {
    if ((selectedRole === 'bakimci' || selectedRole === 'amiri') && !selectedDepartmentId) {
      Alert.alert('Eksik bilgi', 'Departman seçmelisiniz.');
      return;
    }
    try {
      const code = await generateInviteCode(
        selectedRole,
        selectedRole === 'bakimci' || selectedRole === 'amiri' ? selectedDepartmentId ?? undefined : undefined,
        selectedRole === 'bakimci' ? selectedMaintenanceType : undefined,
        selectedRole === 'bakimci' || selectedRole === 'amiri' ? selectedAuthorityLevel : undefined
      );
      setGeneratedCodes((currentCodes) => [
        { code, role: selectedRole, createdAt: Date.now() },
        ...currentCodes,
      ]);
    } catch (error) {
      Alert.alert('Davet kodu oluşturulamadı', getErrorMessage(error));
    }
  };

  const handleLogout = () => {
    Alert.alert('Çıkış Yap', 'Çıkış yapmak istediğinizden emin misiniz?', [
      { text: 'İptal', onPress: () => {} },
      { text: 'Evet', onPress: () => logout() },
    ]);
  };

  const handleCopyCode = async (code: string) => {
    await Clipboard.setStringAsync(code);
    Alert.alert('Kopyalandı', `${code} davet kodu panoya kopyalandı.`);
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
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.welcomeText} numberOfLines={1}>
            Hoş geldin, {user.name}!
          </Text>
          <View style={styles.companyPill}>
            <Text style={styles.companyInfo} numberOfLines={1}>
              İşletme ID: {maskCompanyId(user.companyId)}
            </Text>
          </View>
        </View>

        <Pressable style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Çıkış</Text>
        </Pressable>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={{ gap: spacing.lg, paddingBottom: spacing.xl }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={palette.primary} />}
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Davet Kodu Oluştur</Text>

          <View style={styles.roleSelector}>
            <RoleOption label="Vardiya Amiri" active={selectedRole === 'amiri'} onPress={() => setSelectedRole('amiri')} />
            <RoleOption label="Bakımcı" active={selectedRole === 'bakimci'} onPress={() => setSelectedRole('bakimci')} />
          </View>

          {selectedRole === 'amiri' && (
            <>
              <View style={styles.subField}>
                <Text style={styles.subLabel}>Departman</Text>
                {departments.length === 0 ? (
                  <Text style={styles.noDeptText}>Önce bir departman oluşturmalısınız.</Text>
                ) : (
                  <View style={styles.chipRow}>
                    {departments.map((dept) => (
                      <Pressable
                        key={dept.id}
                        style={[styles.chip, selectedDepartmentId === dept.id && styles.chipActive]}
                        onPress={() => setSelectedDepartmentId(dept.id)}
                      >
                        <Text style={[styles.chipText, selectedDepartmentId === dept.id && styles.chipTextActive]}>
                          {dept.name}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                )}
              </View>

              <View style={styles.subField}>
                <Text style={styles.subLabel}>Yetki Seviyesi</Text>
                <View style={styles.chipRow}>
                  <Pressable
                    style={[styles.chip, selectedAuthorityLevel === 'seviye_1' && styles.chipActive]}
                    onPress={() => setSelectedAuthorityLevel('seviye_1')}
                  >
                    <Text style={[styles.chipText, selectedAuthorityLevel === 'seviye_1' && styles.chipTextActive]}>
                      1. Seviye (Sadece Departmanı)
                    </Text>
                  </Pressable>
                  <Pressable
                    style={[styles.chip, selectedAuthorityLevel === 'seviye_2' && styles.chipActive]}
                    onPress={() => setSelectedAuthorityLevel('seviye_2')}
                  >
                    <Text style={[styles.chipText, selectedAuthorityLevel === 'seviye_2' && styles.chipTextActive]}>
                      2. Seviye (Tüm Departmanlar)
                    </Text>
                  </Pressable>
                </View>
              </View>
            </>
          )}

          {selectedRole === 'bakimci' && (
            <>
              <View style={styles.subField}>
                <Text style={styles.subLabel}>Departman</Text>
                {departments.length === 0 ? (
                  <Text style={styles.noDeptText}>Önce bir departman oluşturmalısınız.</Text>
                ) : (
                  <View style={styles.chipRow}>
                    {departments.map((dept) => (
                      <Pressable
                        key={dept.id}
                        style={[styles.chip, selectedDepartmentId === dept.id && styles.chipActive]}
                        onPress={() => setSelectedDepartmentId(dept.id)}
                      >
                        <Text style={[styles.chipText, selectedDepartmentId === dept.id && styles.chipTextActive]}>
                          {dept.name}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                )}
              </View>

              <View style={styles.subField}>
                <Text style={styles.subLabel}>Bakım Türü</Text>
                <View style={styles.chipRow}>
                  {(['genel', 'elektrik', 'mekanik'] as MaintenanceType[]).map((type) => (
                    <Pressable
                      key={type}
                      style={[styles.chip, selectedMaintenanceType === type && styles.chipActive]}
                      onPress={() => setSelectedMaintenanceType(type)}
                    >
                      <Text style={[styles.chipText, selectedMaintenanceType === type && styles.chipTextActive]}>
                        {type === 'genel' ? 'Genel' : type === 'elektrik' ? 'Elektrik' : 'Mekanik'}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              <View style={styles.subField}>
                <Text style={styles.subLabel}>Yetki Seviyesi</Text>
                <View style={styles.chipRow}>
                  <Pressable
                    style={[styles.chip, selectedAuthorityLevel === 'seviye_1' && styles.chipActive]}
                    onPress={() => setSelectedAuthorityLevel('seviye_1')}
                  >
                    <Text style={[styles.chipText, selectedAuthorityLevel === 'seviye_1' && styles.chipTextActive]}>
                      1. Seviye (Sadece Departmanı)
                    </Text>
                  </Pressable>
                  <Pressable
                    style={[styles.chip, selectedAuthorityLevel === 'seviye_2' && styles.chipActive]}
                    onPress={() => setSelectedAuthorityLevel('seviye_2')}
                  >
                    <Text style={[styles.chipText, selectedAuthorityLevel === 'seviye_2' && styles.chipTextActive]}>
                      2. Seviye (Tüm Departmanlar)
                    </Text>
                  </Pressable>
                </View>
              </View>
            </>
          )}

          <Pressable style={styles.primaryCta} onPress={handleGenerateCode}>
            <Text style={styles.primaryCtaText}>Kod Oluştur</Text>
          </Pressable>
        </View>

        {generatedCodes.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Oluşturulan Kodlar</Text>
            <FlatList
              data={generatedCodes}
              scrollEnabled={false}
              renderItem={({ item }) => (
                <View style={styles.codeCard}>
                  <View style={[styles.roleBadge, getRoleBadgeColor(item.role)]}>
                    <Text style={styles.roleBadgeText}>{item.role === 'amiri' ? 'A' : 'B'}</Text>
                  </View>
                  <View style={styles.codeInfo}>
                    <Text style={styles.codeText}>{item.code}</Text>
                    <Text style={styles.roleLabel}>{item.role === 'amiri' ? 'Vardiya Amiri' : 'Bakımcı'}</Text>
                  </View>
                  <Pressable style={styles.copyButton} onPress={() => handleCopyCode(item.code)}>
                    <Text style={styles.copyButtonText}>Kopyala</Text>
                  </Pressable>
                </View>
              )}
              keyExtractor={(item) => item.code}
            />
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>İşletme Yönetimi</Text>
          <Pressable style={styles.secondaryCta} onPress={() => router.push('/(admin)/register-machine')}>
            <Text style={styles.secondaryCtaText}>Departmanlar ve Makineler</Text>
          </Pressable>
          <Pressable style={styles.secondaryCta} onPress={() => router.push('/(admin)/users')}>
            <Text style={styles.secondaryCtaText}>Kayıtlı Kullanıcılar</Text>
          </Pressable>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Arıza Durumu</Text>
          {tickets.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.empty}>Henüz arıza kaydı yok.</Text>
            </View>
          ) : (
            tickets.map((item) => (
              <View key={item.id} style={styles.ticketCard}>
                <View style={styles.ticketHeader}>
                  <Text style={styles.ticketMachine}>
                    {item.machineName}
                    {item.position ? ` / Poz. ${item.position}` : ''}
                  </Text>
                  {renderStatusBadge(item.status)}
                </View>
                <Text style={styles.ticketDescription} numberOfLines={2}>
                  {item.description}
                </Text>
                <View style={styles.ticketFooter}>
                  <View style={styles.metaRow}>
                    <Text style={styles.metaLabel}>Bildiren:</Text>
                    <Text style={styles.metaValue}>{item.createdByName}</Text>
                  </View>
                  {item.resolvedByName && (
                    <View style={styles.metaRow}>
                      <Text style={styles.metaLabel}>{item.status === 'yapildi' ? 'Yapan:' : 'İnceleyen:'}</Text>
                      <Text style={styles.metaValue}>{item.resolvedByName}</Text>
                    </View>
                  )}
                  <View style={styles.metaRow}>
                    <Text style={styles.metaLabel}>{item.status === 'yapildi' ? 'Çözüm Süresi:' : 'Geçen Süre:'}</Text>
                    <Text style={[styles.metaValue, { color: item.status === 'yapildi' ? palette.success : palette.warning }]}>
                      {calculateDuration(item.createdAt, item.status === 'yapildi' ? item.resolvedAt : undefined)}
                    </Text>
                  </View>
                </View>
              </View>
            ))
          )}
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>Nasıl Çalışır?</Text>
          <Text style={styles.infoText}>
            1. Yukarıdan rol seçerek davet kodu oluşturun{'\n'}
            2. Amir veya bakımcı için departman ve yetki seviyesi belirleyin{'\n'}
            3. Oluşturulan kodu ilgili kişiye verin{'\n'}
            4. Kodu kullanarak sisteme giriş yapabilirler
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

function getErrorMessage(error: unknown) {
  if (error && typeof error === 'object' && 'message' in error) {
    return String((error as { message: unknown }).message);
  }
  return error instanceof Error ? error.message : 'Bilinmeyen bir hata oluştu.';
}

function RoleOption({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.roleOption, active && styles.roleOptionActive]}>
      <Text style={[styles.roleOptionText, active && styles.roleOptionTextActive]}>{label}</Text>
    </Pressable>
  );
}

function getRoleBadgeColor(role: UserRole) {
  return role === 'amiri' ? { backgroundColor: palette.primary } : { backgroundColor: palette.secondary };
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.background },
  header: {
    backgroundColor: palette.white,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  headerLeft: { flex: 1, marginRight: spacing.sm },
  welcomeText: { fontSize: 18, fontWeight: '800', color: palette.text },
  companyPill: { marginTop: 2, alignSelf: 'flex-start', backgroundColor: palette.primaryLight, borderRadius: radius.sm, paddingHorizontal: spacing.sm, paddingVertical: 2 },
  companyInfo: { fontSize: 11, color: palette.primaryDark, fontWeight: '600' },
  logoutButton: { borderWidth: 1.5, borderColor: palette.danger, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, flexShrink: 0 },
  logoutButtonText: { color: palette.danger, fontWeight: '700', fontSize: 13 },
  content: { flex: 1, padding: spacing.lg },
  section: {
    backgroundColor: palette.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
    shadowColor: palette.primaryDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
    borderWidth: 1,
    borderColor: palette.border,
  },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: palette.text },
  roleSelector: { flexDirection: 'row', gap: spacing.sm },
  roleOption: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: palette.border,
    backgroundColor: palette.background,
  },
  roleOptionActive: { backgroundColor: palette.primary, borderColor: palette.primary },
  roleOptionText: { color: palette.textSecondary, fontWeight: '700', fontSize: 14 },
  roleOptionTextActive: { color: palette.white },
  subField: { gap: spacing.xs },
  subLabel: { fontSize: 12, fontWeight: '700', color: palette.textSecondary },
  noDeptText: { fontSize: 12, color: palette.textMuted, fontStyle: 'italic' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  chip: {
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.sm + 2,
    borderRadius: radius.sm,
    borderWidth: 1.5,
    borderColor: palette.border,
    backgroundColor: palette.background,
  },
  chipActive: { backgroundColor: palette.primary, borderColor: palette.primary },
  chipText: { fontSize: 12, fontWeight: '700', color: palette.textSecondary },
  chipTextActive: { color: palette.white },
  primaryCta: {
    backgroundColor: palette.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    shadowColor: palette.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  primaryCtaText: { color: palette.white, fontWeight: '700', fontSize: 15 },
  secondaryCta: { backgroundColor: palette.primaryLight, borderRadius: radius.md, paddingVertical: spacing.md, alignItems: 'center' },
  secondaryCtaText: { color: palette.primaryDark, fontWeight: '700', fontSize: 14 },
  codeCard: {
    backgroundColor: palette.background,
    borderRadius: radius.md,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: palette.border,
  },
  codeInfo: { flex: 1 },
  codeText: { fontSize: 16, fontWeight: '800', color: palette.text, letterSpacing: 1 },
  roleLabel: { fontSize: 12, color: palette.textSecondary, marginTop: 2 },
  copyButton: { borderWidth: 1.5, borderColor: palette.primary, borderRadius: radius.sm, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs },
  copyButtonText: { color: palette.primary, fontSize: 12, fontWeight: '700' },
  roleBadge: { width: 38, height: 38, borderRadius: 19, justifyContent: 'center', alignItems: 'center' },
  roleBadgeText: { color: palette.white, fontWeight: '800', fontSize: 15 },
  emptyContainer: { backgroundColor: palette.background, borderRadius: radius.md, padding: spacing.lg, alignItems: 'center', borderWidth: 1, borderColor: palette.border },
  empty: { color: palette.textSecondary, fontSize: 13 },
  ticketCard: { backgroundColor: palette.background, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.xs, borderWidth: 1, borderColor: palette.border },
  ticketHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.sm },
  ticketMachine: { color: palette.text, fontSize: 14, fontWeight: '700', flex: 1 },
  statusBadge: { borderRadius: radius.sm, paddingHorizontal: spacing.sm, paddingVertical: 3 },
  statusBadgeText: { fontSize: 11, fontWeight: '700' },
  ticketDescription: { color: palette.textSecondary, fontSize: 13, marginTop: spacing.xs, lineHeight: 18 },
  ticketFooter: { marginTop: spacing.sm, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: palette.border, gap: 4 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  metaLabel: { color: palette.textMuted, fontSize: 12, fontWeight: '600' },
  metaValue: { color: palette.textSecondary, fontSize: 12, fontWeight: '700' },
  infoSection: { backgroundColor: palette.primaryLight, borderRadius: radius.lg, padding: spacing.lg, borderLeftWidth: 4, borderLeftColor: palette.primary },
  infoTitle: { fontSize: 15, fontWeight: '800', color: palette.primaryDark, marginBottom: spacing.sm },
  infoText: { fontSize: 13, color: palette.primaryDark, lineHeight: 21, opacity: 0.85 },
});