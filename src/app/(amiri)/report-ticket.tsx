import { useEffect, useState } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, Alert, Modal, FlatList, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { useAuthStore, AuthState } from '../../store/authStore';
import { machineService, ticketService } from '../../services/machineService';
import { PrimaryButton } from '../../components/PrimaryButton';
import { colors, spacing, radius } from '../../constants/theme';
import { Machine, UrgencyLevel } from '../../types';

export default function ReportTicketScreen() {
  const user = useAuthStore((s: AuthState) => s.user)!;
  const [machines, setMachines] = useState<Machine[]>([]);
  const [selectedMachine, setSelectedMachine] = useState<Machine | null>(null);
  const [selectedPosition, setSelectedPosition] = useState<number | null>(null);
  const [urgency, setUrgency] = useState<UrgencyLevel>('normal');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showMachineModal, setShowMachineModal] = useState(false);
  const [showPositionModal, setShowPositionModal] = useState(false);

  useEffect(() => {
    loadMachines();
  }, []);

  const loadMachines = async () => {
    try {
      const data = await machineService.getMachinesByCompany(user.companyId);
      setMachines(data);
    } catch (error) {
      Alert.alert('Hata', 'Makineler yüklenemedi.');
    }
  };

  const handleSubmit = async () => {
    if (!selectedMachine || selectedPosition === null || !description.trim()) {
      Alert.alert('Eksik bilgi', 'Makine, pozisyon ve açıklama zorunludur.');
      return;
    }

    setSubmitting(true);
    try {
      await ticketService.createTicket({
        companyId: user.companyId,
        machineId: selectedMachine.id,
        machineName: selectedMachine.name,
        position: selectedPosition,
        urgency,
        description: description.trim(),
        createdBy: user.id,
        createdByName: user.name,
      });

      Alert.alert('Başarılı', 'Arıza kaydı oluşturuldu. Bakımcı bilgilendirildi.', [
        {
          text: 'Tamam',
          onPress: () => router.back(),
        },
      ]);

      // Reset form
      setSelectedMachine(null);
      setSelectedPosition(null);
      setDescription('');
      setUrgency('normal');
    } catch (error) {
      Alert.alert('Hata', 'Arıza kaydı oluşturulamadı.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Arıza Bildir</Text>
      <Text style={styles.subtitle}>Makine arızası oluşturun</Text>

      <View style={styles.form}>
        {/* Makine Seçimi */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Makine Seçin</Text>
          <TouchableOpacity
            style={[styles.selectButton, selectedMachine && styles.selectButtonActive]}
            onPress={() => setShowMachineModal(true)}
          >
            <Text style={[styles.selectButtonText, !selectedMachine && styles.selectButtonPlaceholder]}>
              {selectedMachine ? selectedMachine.name : 'Makine seçin...'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Pozisyon Seçimi */}
        {selectedMachine && (
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Pozisyon ({selectedMachine.positions})</Text>
            <TouchableOpacity
              style={[styles.selectButton, selectedPosition && styles.selectButtonActive]}
              onPress={() => setShowPositionModal(true)}
            >
              <Text style={[styles.selectButtonText, !selectedPosition && styles.selectButtonPlaceholder]}>
                {selectedPosition ? `Pozisyon ${selectedPosition}` : 'Pozisyon seçin...'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Aciliyet Seviyesi */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Aciliyet Seviyesi</Text>
          <View style={styles.urgencyRow}>
            <UrgencyButton
              label="Normal"
              active={urgency === 'normal'}
              onPress={() => setUrgency('normal')}
            />
            <UrgencyButton
              label="Hat Duruşu"
              active={urgency === 'hat_durusu'}
              onPress={() => setUrgency('hat_durusu')}
            />
          </View>
        </View>

        {/* Açıklama */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Arıza Açıklaması</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Arızayı kısaca açıklayın..."
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            editable={!submitting}
          />
        </View>

        <PrimaryButton
          label={submitting ? 'Gönderiliyor...' : 'Arızayı Bildir'}
          onPress={handleSubmit}
          disabled={submitting}
        />
      </View>

      {/* Makine Modal */}
      <Modal visible={showMachineModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Makine Seçin</Text>
            <FlatList
              data={machines}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => {
                    setSelectedMachine(item);
                    setSelectedPosition(null);
                    setShowMachineModal(false);
                  }}
                >
                  <View>
                    <Text style={styles.modalItemTitle}>{item.name}</Text>
                    <Text style={styles.modalItemDesc}>{item.positions} pozisyonlu</Text>
                  </View>
                  {selectedMachine?.id === item.id && <Text style={styles.checkmark}>✓</Text>}
                </TouchableOpacity>
              )}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
            />
            <PrimaryButton
              label="Kapat"
              onPress={() => setShowMachineModal(false)}
            />
          </View>
        </View>
      </Modal>

      {/* Pozisyon Modal */}
      <Modal visible={showPositionModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Pozisyon Seçin</Text>
            <View style={styles.positionGrid}>
              {selectedMachine &&
                Array.from({ length: selectedMachine.positions }).map((_, index) => {
                  const pos = index + 1;
                  return (
                    <TouchableOpacity
                      key={pos}
                      style={[
                        styles.positionButton,
                        selectedPosition === pos && styles.positionButtonActive,
                      ]}
                      onPress={() => {
                        setSelectedPosition(pos);
                        setShowPositionModal(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.positionButtonText,
                          selectedPosition === pos && styles.positionButtonTextActive,
                        ]}
                      >
                        {pos}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
            </View>
            <PrimaryButton
              label="Kapat"
              onPress={() => setShowPositionModal(false)}
            />
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

function UrgencyButton({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.urgencyButton, active && styles.urgencyButtonActive]}
      onPress={onPress}
    >
      <Text style={[styles.urgencyButtonText, active && styles.urgencyButtonTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
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
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  selectButton: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    backgroundColor: colors.card,
  },
  selectButtonActive: {
    borderColor: colors.primary,
    backgroundColor: colors.background,
  },
  selectButtonText: {
    fontSize: 16,
    color: colors.text,
  },
  selectButtonPlaceholder: {
    color: colors.textSecondary,
  },
  urgencyRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  urgencyButton: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  urgencyButtonActive: {
    backgroundColor: colors.danger,
    borderColor: colors.danger,
  },
  urgencyButtonText: {
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  urgencyButtonTextActive: {
    color: '#fff',
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
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.lg,
  },
  modalItem: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  modalItemDesc: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  checkmark: {
    fontSize: 20,
    color: colors.primary,
  },
  positionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  positionButton: {
    width: '23%',
    aspectRatio: 1,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  positionButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  positionButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  positionButtonTextActive: {
    color: '#fff',
  },
});
