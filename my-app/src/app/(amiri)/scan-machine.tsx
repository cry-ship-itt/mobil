import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { QRScanner } from '../../components/QRScanner';
import { machineService } from '../../services/machineService';
import { useAuthStore, AuthState } from '../../store/authStore';
import { colors } from '../../constants/theme';

export default function AmiriScanMachineScreen() {
  const user = useAuthStore((state: AuthState) => state.user);
  const [message, setMessage] = useState('');

  const scan = async (value: string) => {
    if (!user) return;
    try {
      const data = machineService.decodeMachineFromQR(value);
      if (data.companyId !== user.companyId) throw new Error('Bu QR kod sizin işletmenize ait değil.');
      const machine = await machineService.getMachineById(data.id);
      if (!machine) throw new Error('Makine bulunamadı.');
      router.replace({ pathname: '/(amiri)/report-ticket', params: { machineId: machine.id } });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'QR kod okunamadı.');
      Alert.alert('QR hatası', error instanceof Error ? error.message : 'QR kod okunamadı.');
    }
  };

  if (!user) return null;

  return (
    <View style={styles.root}>
      <Text style={styles.title}>Makine QR Kodunu Okut</Text>
      <QRScanner onScanned={(value) => { void scan(value); }} />
      {message ? <Text style={styles.message}>{message}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  title: { color: colors.text, fontSize: 20, fontWeight: '800', padding: 16 },
  message: { color: colors.danger, padding: 16 },
});