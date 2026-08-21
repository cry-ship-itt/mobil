import { useEffect, useRef, useState } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, Alert, Modal, TouchableOpacity } from 'react-native';
import * as Sharing from 'expo-sharing';
import { captureRef } from 'react-native-view-shot';
import QRCode from 'react-native-qrcode-svg';
import { useAuthStore, AuthState } from '../../store/authStore';
import { machineService } from '../../services/machineService';
import { PrimaryButton } from '../../components/PrimaryButton';
import { colors, spacing, radius } from '../../constants/theme';
import { Machine } from '../../types';

export default function RegisterMachineScreen() {
  const user = useAuthStore((s: AuthState) => s.user)!;
  const [machineName, setMachineName] = useState('');
  const [positions, setPositions] = useState('');
  const [loading, setLoading] = useState(false);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [createdMachine, setCreatedMachine] = useState<Machine | null>(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [sharing, setSharing] = useState(false);
  const qrRef = useRef<View | null>(null);

  useEffect(() => {
    void loadMachines();
  }, [user.companyId]);

  const loadMachines = async () => {
    const companyMachines = await machineService.getMachinesByCompany(user.companyId);
    setMachines(companyMachines);
  };

  const handleCreateMachine = async () => {
    if (!machineName.trim() || !positions.trim()) {
      Alert.alert('Eksik bilgi', 'Makine adı ve pozisyon sayısı zorunludur.');
      return;
    }

    const positionNum = parseInt(positions, 10);
    if (isNaN(positionNum) || positionNum < 1) {
      Alert.alert('Hata', 'Pozisyon sayısı 1 veya daha fazla olmalıdır.');
      return;
    }

    setLoading(true);
    try {
      const machine = await machineService.createMachine(
        user.companyId,
        machineName.trim(),
        positionNum,
        user.id
      );
      setMachines((currentMachines) => [...currentMachines, machine]);
      setCreatedMachine(machine);
      setShowQRModal(true);
    } catch (error) {
      Alert.alert('Hata', 'Makine oluşturulamadı.');
    } finally {
      setLoading(false);
    }
  };

  const handleShareQR = async () => {
    if (!qrRef.current || !createdMachine || sharing) return;

    setSharing(true);
    try {
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert('Paylaşım kullanılamıyor', 'Bu cihaz QR görselini paylaşmayı desteklemiyor.');
        return;
      }

      const uri = await captureRef(qrRef, {
        format: 'png',
        quality: 1,
        result: 'tmpfile',
      });
      await Sharing.shareAsync(uri, {
        mimeType: 'image/png',
        dialogTitle: `${createdMachine.name} QR kodunu paylaş`,
        UTI: 'public.png',
      });
    } catch {
      Alert.alert('Hata', 'QR kodu dışa aktarılamadı.');
    } finally {
      setSharing(false);
    }
  };

  const handleNewMachine = () => {
    setMachineName('');
    setPositions('');
    setCreatedMachine(null);
    setShowQRModal(false);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Yeni Makine Tanıt</Text>
      <Text style={styles.subtitle}>Sisteme yeni makine kaydedin</Text>

      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Makine Adı</Text>
          <TextInput
            style={styles.input}
            placeholder="Örn: POY-2 Sarım Makinesi"
            value={machineName}
            onChangeText={setMachineName}
            editable={!loading}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Pozisyon Sayısı</Text>
          <TextInput
            style={styles.input}
            placeholder="Örn: 4"
            value={positions}
            onChangeText={setPositions}
            keyboardType="number-pad"
            editable={!loading}
          />
        </View>

        <PrimaryButton
          label={loading ? 'Oluşturuluyor...' : 'Makineyi Tanıt'}
          onPress={handleCreateMachine}
          disabled={loading}
        />
      </View>

        <View style={styles.machineListSection}>
          <Text style={styles.sectionTitle}>Tanıtılan Makineler</Text>
          {machines.length === 0 ? (
            <Text style={styles.emptyText}>Henüz tanıtılmış makine yok.</Text>
          ) : (
            machines.map((machine) => (
              <TouchableOpacity
                key={machine.id}
                style={styles.machineRow}
                onPress={() => {
                  setCreatedMachine(machine);
                  setShowQRModal(true);
                }}
              >
                <View style={styles.machineRowText}>
                  <Text style={styles.machineRowName}>{machine.name}</Text>
                  <Text style={styles.machineRowDetails}>{machine.positions} pozisyon</Text>
                </View>
                <Text style={styles.qrAction}>QR göster</Text>
              </TouchableOpacity>
            ))
          )}
        </View>

      <Modal visible={showQRModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Makine Başarıyla Oluşturuldu ✅</Text>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="QR penceresini kapat"
                onPress={() => setShowQRModal(false)}
                style={styles.closeButton}
              >
                <Text style={styles.closeButtonText}>Kapat</Text>
              </TouchableOpacity>
            </View>

            {createdMachine && (
              <>
                <View ref={qrRef} collapsable={false} style={styles.qrBox}>
                  <Text style={styles.qrLabel}>QR Kod:</Text>
                  <View style={styles.qrCodeDisplay}>
                    <QRCode
                      value={createdMachine.qrCode}
                      size={190}
                      color="#111827"
                      backgroundColor="#FFFFFF"
                    />
                    <Text style={styles.qrCodeText}>{createdMachine.id}</Text>
                    <Text style={styles.qrCodeSubtext}>{createdMachine.name}</Text>
                  </View>
                  <Text style={styles.qrNote}>
                    Bu QR kodu makinaya yapıştırın. Arıza bildirmek sırasında QR'ı tarayarak hızlı seçim yapabilir.
                  </Text>
                </View>

                <PrimaryButton
                  label={sharing ? 'Hazırlanıyor...' : 'QR Kodunu Dışa Aktar'}
                  onPress={handleShareQR}
                  disabled={sharing}
                />

                <View style={styles.machineInfo}>
                  <InfoRow label="Makine Adı" value={createdMachine.name} />
                  <InfoRow label="Pozisyon" value={`${createdMachine.positions} pozisyonlu`} />
                  <InfoRow label="ID" value={createdMachine.id} />
                </View>
              </>
            )}

            <PrimaryButton
              label="Yeni Makine Tanıt"
              onPress={handleNewMachine}
            />
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}:</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
    backgroundColor: colors.background,
    flexGrow: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
  },
  form: {
    gap: spacing.md,
  },
  machineListSection: {
    marginTop: spacing.xl,
    gap: spacing.sm,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  machineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  machineRowText: {
    gap: spacing.xs,
  },
  machineRowName: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  machineRowDetails: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  qrAction: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  inputGroup: {
    gap: spacing.xs,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.card,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.card,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing.lg,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  closeButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  closeButtonText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  qrBox: {
    backgroundColor: colors.background,
    borderRadius: radius.md,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  qrLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.md,
  },
  qrCodeDisplay: {
    backgroundColor: '#fff',
    borderRadius: radius.md,
    padding: spacing.lg,
    marginBottom: spacing.md,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.primary,
  },
  qrCodeText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  qrCodeSubtext: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '600',
  },
  qrNote: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  machineInfo: {
    backgroundColor: colors.background,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  infoLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  infoValue: {
    fontSize: 12,
    color: colors.text,
    fontWeight: '600',
  },
});
