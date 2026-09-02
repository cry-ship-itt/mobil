import { useCallback, useRef, useState } from 'react';
import { Alert, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { captureRef } from 'react-native-view-shot';
import QRCode from 'react-native-qrcode-svg';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../utils/supabase';
import { PrimaryButton } from '../../components/PrimaryButton';
import { spacing, radius } from '../../constants/theme';

// Tema Paleti
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

// Yerel Tipler (Yeni Mimariye Uygun)
interface Department {
  id: string;
  name: string;
}

interface Machine {
  id: string;
  name: string;
  positions: number;
  qr_code: string;
  department_id: string;
  serial_number?: string;
  max_speed?: number;
}

export default function AdminRegisterMachineScreen() {
  const user = useAuthStore((s) => s.user);
  const qrRef = useRef<View | null>(null);

  // Veri Stateleri
  const [departments, setDepartments] = useState<Department[]>([]);
  const [machines, setMachines] = useState<Machine[]>([]);
  
  // Form Stateleri
  const [selectedDeptId, setSelectedDeptId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [positions, setPositions] = useState('');
  const [serialNo, setSerialNo] = useState('');
  const [maxSpeed, setMaxSpeed] = useState('');
  
  // UI Stateleri
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Machine | null>(null);
  const [visible, setVisible] = useState(false);

  // Verileri Supabase'den Çek (Bypass Service - Doğrudan Senkronizasyon)
  const loadData = useCallback(async () => {
    if (!user?.companyId) return;
    
    try {
      // 1. Departmanları Yükle
      const { data: depts } = await supabase
        .from('departments')
        .select('id, name')
        .eq('company_id', user.companyId)
        .eq('is_active', true)
        .order('created_at', { ascending: true });
        
      if (depts) {
        setDepartments(depts);
        // Eğer seçili yoksa ve liste doluysa ilk departmanı varsayılan seç
        if (!selectedDeptId && depts.length > 0) {
          setSelectedDeptId(depts[0].id);
        }
      }

      // 2. Makineleri Yükle
      const { data: machs } = await supabase
        .from('machines')
        .select('*')
        .eq('company_id', user.companyId)
        .order('created_at', { ascending: false });
        
      if (machs) setMachines(machs);
    } catch (error) {
      console.error('Veri yükleme hatası:', error);
    }
  }, [user, selectedDeptId]);

  // Sayfaya her odaklanıldığında veriyi tazele
  useFocusEffect(
    useCallback(() => {
      void loadData();
    }, [loadData])
  );

  // Faz 1 - RPC ile Makine Oluşturma
  const createMachine = async () => {
    const count = Number.parseInt(positions, 10);
    
    if (!selectedDeptId) {
      Alert.alert('Eksik Bilgi', 'Lütfen makinenin bağlı olduğu departmanı seçin (Hiç departman yoksa önce departman oluşturun).');
      return;
    }
    
    if (!name.trim() || !Number.isInteger(count) || count < 1) {
      Alert.alert('Eksik Bilgi', 'Makine adı ve en az 1 pozisyon girilmesi zorunludur.');
      return;
    }

    setLoading(true);
    try {
      const speedValue = maxSpeed.trim() ? Number.parseFloat(maxSpeed) : null;

      // Yeni yazdığımız RPC çağrısı
      const { data, error } = await supabase.rpc('create_machine_full', {
        target_department_id: selectedDeptId,
        machine_name: name.trim(),
        position_count: count,
        serial_no: serialNo.trim() || null,
        max_speed_value: speedValue,
      });

      if (error) throw error;

      Alert.alert('Başarılı', 'Makine, bağlı pozisyonları ve varsayılan parça ağacı ile oluşturuldu!');
      
      // Formu temizle ve listeyi yenile
      setName('');
      setPositions('');
      setSerialNo('');
      setMaxSpeed('');
      await loadData();
      
    } catch (error) {
      Alert.alert('Hata', error instanceof Error ? error.message : 'Makine oluşturulamadı.');
    } finally {
      setLoading(false);
    }
  };

  const shareQR = async () => {
    if (!selected || !qrRef.current) return;
    if (!(await Sharing.isAvailableAsync())) {
      Alert.alert('Paylaşım Kullanılamıyor', 'Cihazınız dosya paylaşımını desteklemiyor.');
      return;
    }
    const uri = await captureRef(qrRef, { format: 'png', quality: 1, result: 'tmpfile' });
    await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: `${selected.name} QR Kodu`, UTI: 'public.png' });
  };

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        <Text style={styles.title}>Makine Yönetimi</Text>
        <Text style={styles.subtitle}>Departman seçerek sahada kullanılacak makineleri oluşturun.</Text>
      </View>

      <View style={styles.formCard}>
        <Text style={styles.cardHeaderTitle}>Yeni Makine Ekle</Text>
        
        {/* DEPARTMAN SEÇİMİ (Yeni) */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Bağlı Olduğu Departman</Text>
          {departments.length === 0 ? (
            <Text style={styles.emptyErrorText}>Aktif departman bulunamadı. Lütfen önce departman oluşturun.</Text>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
              {departments.map((dept) => (
                <TouchableOpacity
                  key={dept.id}
                  activeOpacity={0.7}
                  style={[styles.chip, selectedDeptId === dept.id && styles.chipSelected]}
                  onPress={() => setSelectedDeptId(dept.id)}
                >
                  <Text style={[styles.chipText, selectedDeptId === dept.id && styles.chipTextSelected]}>
                    {dept.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Makine Adı</Text>
          <TextInput
            style={styles.input}
            placeholder="Örn: Dokuma Tezgahı #1"
            placeholderTextColor={palette.textMuted}
            value={name}
            onChangeText={setName}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Pozisyon Sayısı</Text>
          <TextInput
            style={styles.input}
            placeholder="Örn: 12"
            placeholderTextColor={palette.textMuted}
            value={positions}
            onChangeText={setPositions}
            keyboardType="number-pad"
          />
        </View>

        {/* OPSİYONEL ALANLAR (Yeni Faz 1) */}
        <View style={styles.row}>
          <View style={[styles.inputGroup, { flex: 1 }]}>
            <Text style={styles.label}>Seri No (Opsiyonel)</Text>
            <TextInput
              style={styles.input}
              placeholder="Örn: SN-9204"
              placeholderTextColor={palette.textMuted}
              value={serialNo}
              onChangeText={setSerialNo}
            />
          </View>
          <View style={[styles.inputGroup, { flex: 1 }]}>
            <Text style={styles.label}>Max Hız (Opsiyonel)</Text>
            <TextInput
              style={styles.input}
              placeholder="Örn: 1200"
              placeholderTextColor={palette.textMuted}
              value={maxSpeed}
              onChangeText={setMaxSpeed}
              keyboardType="numeric"
            />
          </View>
        </View>

        <View style={styles.buttonWrapper}>
          <PrimaryButton
            label={loading ? 'Oluşturuluyor...' : 'Makineyi Tanıt'}
            onPress={createMachine}
            loading={loading}
          />
        </View>
      </View>

      <Text style={styles.sectionTitle}>Tanıtılan Makineler</Text>
      
      {machines.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.empty}>Henüz makine tanıtılmadı.</Text>
        </View>
      ) : (
        machines.map((machine) => (
          <TouchableOpacity
            key={machine.id}
            activeOpacity={0.8}
            style={styles.machineCard}
            onPress={() => { setSelected(machine); setVisible(true); }}
          >
            <View style={styles.machineInfo}>
              <Text style={styles.machineName}>{machine.name}</Text>
              <Text style={styles.machineMeta}>
                {departments.find(d => d.id === machine.department_id)?.name || 'Departman Yok'} • {machine.positions} Pozisyon
              </Text>
            </View>
            <View style={styles.qrBadge}>
              <Text style={styles.qrBadgeText}>QR Göster ›</Text>
            </View>
          </TouchableOpacity>
        ))
      )}

      {/* QR Kod Modal */}
      <Modal visible={visible} transparent animationType="slide" onRequestClose={() => setVisible(false)}>
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{selected?.name}</Text>
              <Text style={styles.modalSubtitle}>Saha personeli taraması için</Text>
            </View>

            {selected && (
              <View ref={qrRef} collapsable={false} style={styles.qrBox}>
                {/* qrCode yerine qr_code kullanıldı (Veritabanından snake_case dönüyor) */}
                <QRCode value={selected.qr_code || 'QR_YOK'} size={200} color={palette.text} backgroundColor={palette.white} />
                <Text style={styles.qrId}>ID: {selected.id}</Text>
              </View>
            )}

            <View style={styles.modalActions}>
              <PrimaryButton label="QR Kodunu Dışa Aktar" onPress={() => { void shareQR(); }} />
              <TouchableOpacity style={styles.closeButton} onPress={() => setVisible(false)}>
                <Text style={styles.closeButtonText}>Kapat</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.background },
  container: { padding: spacing.lg, paddingTop: spacing.xl, paddingBottom: spacing.xl * 2, gap: spacing.md },
  header: { marginBottom: spacing.xs },
  title: { color: palette.text, fontSize: 24, fontWeight: '800' },
  subtitle: { color: palette.textSecondary, fontSize: 13, marginTop: 4, lineHeight: 18 },
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
  cardHeaderTitle: { fontSize: 16, fontWeight: '800', color: palette.text, marginBottom: spacing.xs },
  inputGroup: { gap: spacing.xs },
  row: { flexDirection: 'row', gap: spacing.md },
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
  chipScroll: { flexDirection: 'row', marginTop: 4, marginBottom: 4 },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: palette.background,
    borderWidth: 1,
    borderColor: palette.border,
    marginRight: 8,
  },
  chipSelected: { backgroundColor: palette.primary, borderColor: palette.primary },
  chipText: { fontSize: 13, fontWeight: '700', color: palette.textSecondary },
  chipTextSelected: { color: palette.white },
  emptyErrorText: { color: palette.danger, fontSize: 13, fontWeight: '600', marginTop: 4 },
  buttonWrapper: { marginTop: spacing.xs },
  sectionTitle: { color: palette.text, fontSize: 17, fontWeight: '800', marginTop: spacing.sm },
  emptyContainer: { backgroundColor: palette.card, borderRadius: radius.md, padding: spacing.lg, alignItems: 'center', borderWidth: 1, borderColor: palette.border },
  empty: { color: palette.textSecondary, fontSize: 13 },
  machineCard: {
    backgroundColor: palette.card,
    borderColor: palette.border,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  machineInfo: { flex: 1 },
  machineName: { color: palette.text, fontWeight: '700', fontSize: 15 },
  machineMeta: { color: palette.textSecondary, fontSize: 12, marginTop: 2 },
  qrBadge: { backgroundColor: palette.primaryLight, paddingHorizontal: spacing.sm + 2, paddingVertical: spacing.xs, borderRadius: radius.sm },
  qrBadgeText: { color: palette.primaryDark, fontWeight: '700', fontSize: 12 },
  overlay: { flex: 1, backgroundColor: 'rgba(31, 27, 46, 0.6)', justifyContent: 'flex-end' },
  modal: { backgroundColor: palette.card, padding: spacing.lg, gap: spacing.lg, borderTopLeftRadius: radius.lg * 1.5, borderTopRightRadius: radius.lg * 1.5, borderTopWidth: 1, borderColor: palette.border },
  modalHeader: { alignItems: 'center' },
  modalTitle: { color: palette.text, fontSize: 20, fontWeight: '800' },
  modalSubtitle: { color: palette.textSecondary, fontSize: 12, marginTop: 2 },
  qrBox: { backgroundColor: palette.white, padding: spacing.lg, alignItems: 'center', justifyContent: 'center', borderRadius: radius.md, borderWidth: 1, borderColor: palette.border, gap: spacing.sm, alignSelf: 'center' },
  qrId: { color: palette.textSecondary, fontSize: 11, fontFamily: 'monospace' },
  modalActions: { gap: spacing.sm },
  closeButton: { paddingVertical: spacing.md, alignItems: 'center', borderRadius: radius.md, backgroundColor: palette.dangerLight },
  closeButtonText: { color: palette.danger, fontWeight: '700', fontSize: 14 },
});