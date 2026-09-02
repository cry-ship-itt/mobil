import { useEffect, useState } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, Alert, Modal, FlatList, TouchableOpacity, Pressable } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useAuthStore, AuthState } from '../../store/authStore';
import { supabase } from '../../utils/supabase';
import { ticketService } from '../../services/ticketService';
import { PrimaryButton } from '../../components/PrimaryButton';
import { spacing, radius } from '../../constants/theme';
import { UrgencyLevel } from '../../types';

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

interface MachineRow {
  id: string;
  name: string;
  positions: number;
  department_id: string | null;
}

interface PositionRow {
  id: string;
  position_number: number;
}

interface CategoryRow {
  id: string;
  parent_id: string | null;
  group_type: 'elektrik' | 'mekanik';
  name: string;
}

export default function ReportTicketScreen() {
  const user = useAuthStore((s: AuthState) => s.user);
  const { machineId: paramMachineId } = useLocalSearchParams<{ machineId?: string }>();

  const [machines, setMachines] = useState<MachineRow[]>([]);
  const [selectedMachine, setSelectedMachine] = useState<MachineRow | null>(null);

  const [positions, setPositions] = useState<PositionRow[]>([]);
  const [selectedPosition, setSelectedPosition] = useState<PositionRow | null>(null);

  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<CategoryRow | null>(null);

  const [urgency, setUrgency] = useState<UrgencyLevel>('normal');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [showMachineModal, setShowMachineModal] = useState(false);
  const [showPositionModal, setShowPositionModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  const companyId = user?.companyId ?? '';

  useEffect(() => {
    if (!companyId) return;
    void loadMachines();
  }, [companyId]);

  const loadMachines = async () => {
    const { data, error } = await supabase
      .from('machines')
      .select('id, name, positions, department_id')
      .eq('company_id', companyId)
      .order('name', { ascending: true });
    if (error) {
      Alert.alert('Hata', 'Makineler yüklenemedi.');
      return;
    }
    const list = (data as MachineRow[]) ?? [];
    setMachines(list);
    if (paramMachineId) {
      const scanned = list.find((m) => m.id === paramMachineId);
      if (scanned) void handleSelectMachine(scanned);
    }
  };

  const handleSelectMachine = async (machine: MachineRow) => {
    setSelectedMachine(machine);
    setSelectedPosition(null);
    setSelectedCategory(null);
    setShowMachineModal(false);

    const [positionsRes, categoriesRes] = await Promise.all([
      supabase.from('machine_positions').select('id, position_number').eq('machine_id', machine.id).order('position_number'),
      supabase.from('machine_categories').select('id, parent_id, group_type, name').eq('machine_id', machine.id).eq('is_active', true).order('sort_order'),
    ]);

    if (positionsRes.error || categoriesRes.error) {
      Alert.alert('Hata', 'Makine detayları yüklenemedi.');
      return;
    }
    setPositions((positionsRes.data as PositionRow[]) ?? []);
    setCategories((categoriesRes.data as CategoryRow[]) ?? []);
  };

  // Sadece yaprak (alt kategorisi olmayan) düğümleri seçilebilir yapıyoruz —
  // kök kategoriler (Elektrik/Mekanik ana başlıkları) ve orta seviyeler sadece gruplama içindir.
  const isLeaf = (category: CategoryRow) => !categories.some((c) => c.parent_id === category.id);

  const buildCategoryLabel = (category: CategoryRow): string => {
    const path: string[] = [category.name];
    let current = category;
    while (current.parent_id) {
      const parent = categories.find((c) => c.id === current.parent_id);
      if (!parent) break;
      path.unshift(parent.name);
      current = parent;
    }
    return path.join(' › ');
  };

  const handleSubmit = async () => {
    if (!user) return;
    if (!selectedMachine || !selectedPosition || !selectedCategory || !description.trim()) {
      Alert.alert('Eksik bilgi', 'Makine, pozisyon, parça ve açıklama zorunludur.');
      return;
    }

    setSubmitting(true);
    try {
      await ticketService.createTicket({
        companyId: user.companyId,
        machineId: selectedMachine.id,
        machineName: selectedMachine.name,
        departmentId: selectedMachine.department_id ?? undefined,
        positionId: selectedPosition.id,
        positionNumber: selectedPosition.position_number,
        categoryId: selectedCategory.id,
        urgency,
        maintenanceType: selectedCategory.group_type,
        description: description.trim(),
        createdBy: user.id,
        createdByName: user.name,
      });

      Alert.alert('Başarılı', 'Arıza kaydı oluşturuldu. Bakım ekibi bilgilendirildi.', [
        { text: 'Tamam', onPress: () => router.back() },
      ]);

      setSelectedMachine(null);
      setSelectedPosition(null);
      setSelectedCategory(null);
      setDescription('');
      setUrgency('normal');
    } catch (error) {
      Alert.alert('Hata', error instanceof Error ? error.message : 'Arıza kaydı oluşturulamadı.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) return null;

  const leafCategories = categories.filter(isLeaf);

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        <Text style={styles.title}>Arıza Bildir</Text>
        <Text style={styles.subtitle}>Saha arızası veya bakım talebi oluşturun</Text>
      </View>

      <View style={styles.formCard}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Makine Seçin</Text>
          <TouchableOpacity
            activeOpacity={0.8}
            style={[styles.selectButton, selectedMachine && styles.selectButtonActive]}
            onPress={() => setShowMachineModal(true)}
          >
            <Text style={[styles.selectButtonText, !selectedMachine && styles.selectButtonPlaceholder]}>
              {selectedMachine ? selectedMachine.name : 'Listeden makine seçin...'}
            </Text>
            <Text style={styles.chevron}>▼</Text>
          </TouchableOpacity>
        </View>

        {selectedMachine && (
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Pozisyon</Text>
            <TouchableOpacity
              activeOpacity={0.8}
              style={[styles.selectButton, selectedPosition && styles.selectButtonActive]}
              onPress={() => setShowPositionModal(true)}
            >
              <Text style={[styles.selectButtonText, !selectedPosition && styles.selectButtonPlaceholder]}>
                {selectedPosition ? `Pozisyon ${selectedPosition.position_number}` : 'Pozisyon seçin...'}
              </Text>
              <Text style={styles.chevron}>▼</Text>
            </TouchableOpacity>
          </View>
        )}

        {selectedMachine && (
          <View style={styles.inputGroup}>
            <Text style={styles.label}>İlgili Parça</Text>
            <TouchableOpacity
              activeOpacity={0.8}
              style={[styles.selectButton, selectedCategory && styles.selectButtonActive]}
              onPress={() => setShowCategoryModal(true)}
            >
              <Text style={[styles.selectButtonText, !selectedCategory && styles.selectButtonPlaceholder]} numberOfLines={1}>
                {selectedCategory ? buildCategoryLabel(selectedCategory) : 'Parça seçin...'}
              </Text>
              <Text style={styles.chevron}>▼</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Aciliyet Seviyesi</Text>
          <View style={styles.toggleRow}>
            <UrgencyOptionButton label="Normal" active={urgency === 'normal'} isDanger={false} onPress={() => setUrgency('normal')} />
            <UrgencyOptionButton label="Hat Duruşu 🚨" active={urgency === 'hat_durusu'} isDanger={true} onPress={() => setUrgency('hat_durusu')} />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Arıza Açıklaması</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Arızanın detaylarını açıklayın..."
            placeholderTextColor={palette.textMuted}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            editable={!submitting}
          />
        </View>

        <View style={styles.buttonWrapper}>
          <PrimaryButton label={submitting ? 'Gönderiliyor...' : 'Arızayı Bildir'} onPress={handleSubmit} disabled={submitting} />
        </View>
      </View>

      {/* Makine Seçim Modalı */}
      <Modal visible={showMachineModal} transparent animationType="slide" onRequestClose={() => setShowMachineModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Makine Seçin</Text>
            <FlatList
              data={machines}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.modalList}
              renderItem={({ item }) => (
                <TouchableOpacity
                  activeOpacity={0.7}
                  style={[styles.modalItem, selectedMachine?.id === item.id && styles.modalItemActive]}
                  onPress={() => void handleSelectMachine(item)}
                >
                  <Text style={styles.modalItemTitle}>{item.name}</Text>
                  {selectedMachine?.id === item.id && <Text style={styles.checkmark}>✓</Text>}
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity style={styles.modalCloseButton} onPress={() => setShowMachineModal(false)}>
              <Text style={styles.modalCloseText}>Kapat</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Pozisyon Seçim Modalı */}
      <Modal visible={showPositionModal} transparent animationType="slide" onRequestClose={() => setShowPositionModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Pozisyon Seçin</Text>
            <ScrollView contentContainerStyle={styles.positionGrid}>
              {positions.map((pos) => {
                const isActive = selectedPosition?.id === pos.id;
                return (
                  <TouchableOpacity
                    key={pos.id}
                    activeOpacity={0.7}
                    style={[styles.positionButton, isActive && styles.positionButtonActive]}
                    onPress={() => {
                      setSelectedPosition(pos);
                      setShowPositionModal(false);
                    }}
                  >
                    <Text style={[styles.positionButtonText, isActive && styles.positionButtonTextActive]}>{pos.position_number}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <TouchableOpacity style={styles.modalCloseButton} onPress={() => setShowPositionModal(false)}>
              <Text style={styles.modalCloseText}>Kapat</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Parça/Kategori Seçim Modalı — yaprak düğümler listeleniyor, tam yol gösteriliyor */}
      <Modal visible={showCategoryModal} transparent animationType="slide" onRequestClose={() => setShowCategoryModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>İlgili Parçayı Seçin</Text>
            <FlatList
              data={leafCategories}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.modalList}
              renderItem={({ item }) => (
                <TouchableOpacity
                  activeOpacity={0.7}
                  style={[styles.modalItem, selectedCategory?.id === item.id && styles.modalItemActive]}
                  onPress={() => {
                    setSelectedCategory(item);
                    setShowCategoryModal(false);
                  }}
                >
                  <View>
                    <Text style={styles.modalItemTitle}>{buildCategoryLabel(item)}</Text>
                    <Text style={styles.modalItemDesc}>{item.group_type === 'elektrik' ? 'Elektrik' : 'Mekanik'}</Text>
                  </View>
                  {selectedCategory?.id === item.id && <Text style={styles.checkmark}>✓</Text>}
                </TouchableOpacity>
              )}
              ListEmptyComponent={<Text style={styles.modalItemDesc}>Bu makine için tanımlı parça yok.</Text>}
            />
            <TouchableOpacity style={styles.modalCloseButton} onPress={() => setShowCategoryModal(false)}>
              <Text style={styles.modalCloseText}>Kapat</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

function UrgencyOptionButton({ label, active, isDanger, onPress }: { label: string; active: boolean; isDanger: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.toggleButton, active && (isDanger ? styles.urgencyDangerActive : styles.urgencyNormalActive)]}>
      <Text style={[styles.toggleButtonText, active && styles.toggleButtonTextActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.background },
  container: { padding: spacing.lg, paddingTop: spacing.xl, paddingBottom: spacing.xl * 2 },
  header: { marginBottom: spacing.lg },
  title: { fontSize: 24, fontWeight: '800', color: palette.text },
  subtitle: { fontSize: 13, color: palette.textSecondary, marginTop: 4 },
  formCard: {
    backgroundColor: palette.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: palette.border,
    shadowColor: palette.primaryDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  inputGroup: { gap: spacing.xs },
  label: { fontSize: 13, fontWeight: '700', color: palette.text },
  input: {
    borderWidth: 1.5,
    borderColor: palette.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    fontSize: 15,
    color: palette.text,
    backgroundColor: palette.background,
  },
  textArea: { minHeight: 110, textAlignVertical: 'top' },
  selectButton: {
    borderWidth: 1.5,
    borderColor: palette.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: palette.background,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectButtonActive: { borderColor: palette.primary, backgroundColor: palette.white },
  selectButtonText: { fontSize: 15, color: palette.text, fontWeight: '600', flex: 1 },
  selectButtonPlaceholder: { color: palette.textMuted, fontWeight: '400' },
  chevron: { fontSize: 10, color: palette.textSecondary },
  toggleRow: { flexDirection: 'row', gap: spacing.xs },
  toggleButton: {
    flex: 1,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.xs,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: palette.border,
    backgroundColor: palette.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  urgencyNormalActive: { backgroundColor: palette.primary, borderColor: palette.primary },
  urgencyDangerActive: { backgroundColor: palette.danger, borderColor: palette.danger },
  toggleButtonText: { textAlign: 'center', fontSize: 13, fontWeight: '700', color: palette.textSecondary },
  toggleButtonTextActive: { color: palette.white },
  buttonWrapper: { marginTop: spacing.xs },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(31, 27, 46, 0.6)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: palette.card,
    borderTopLeftRadius: radius.lg * 1.5,
    borderTopRightRadius: radius.lg * 1.5,
    padding: spacing.lg,
    maxHeight: '80%',
    borderTopWidth: 1,
    borderColor: palette.border,
  },
  modalTitle: { fontSize: 18, fontWeight: '800', color: palette.text, marginBottom: spacing.md, textAlign: 'center' },
  modalList: { gap: spacing.xs },
  modalItem: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
    backgroundColor: palette.background,
  },
  modalItemActive: { borderColor: palette.primary, backgroundColor: palette.primaryLight },
  modalItemTitle: { fontSize: 15, fontWeight: '700', color: palette.text },
  modalItemDesc: { fontSize: 12, color: palette.textSecondary, marginTop: 2 },
  checkmark: { fontSize: 16, fontWeight: '800', color: palette.primary },
  positionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, paddingVertical: spacing.xs },
  positionButton: {
    width: '22%',
    aspectRatio: 1,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: palette.border,
    backgroundColor: palette.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  positionButtonActive: { backgroundColor: palette.primary, borderColor: palette.primary },
  positionButtonText: { fontSize: 16, fontWeight: '800', color: palette.text },
  positionButtonTextActive: { color: palette.white },
  modalCloseButton: {
    marginTop: spacing.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderRadius: radius.md,
    backgroundColor: palette.background,
    borderWidth: 1,
    borderColor: palette.border,
  },
  modalCloseText: { color: palette.textSecondary, fontWeight: '700', fontSize: 14 },
});