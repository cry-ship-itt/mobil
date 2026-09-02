import { useState } from 'react';
import { Alert, Button, StyleSheet, Text, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { colors } from '../constants/theme';

export function QRScanner({ onScanned }: { onScanned: (value: string) => void }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  if (!permission) return <View style={styles.center}><Text style={styles.text}>Kamera hazırlanıyor...</Text></View>;
  if (!permission.granted) return <View style={styles.center}><Text style={styles.text}>QR okutmak için kamera izni gerekli.</Text><Button title="Kamera izni ver" onPress={() => { void requestPermission(); }} /></View>;
  return <View style={styles.wrapper}>
    <CameraView style={styles.camera} barcodeScannerSettings={{ barcodeTypes: ['qr'] }} onBarcodeScanned={scanned ? undefined : ({ data }) => { setScanned(true); onScanned(data); }} />
    <View style={styles.guide}><Text style={styles.text}>Makinenin QR kodunu çerçeveye alın</Text></View>
    {scanned && <Button title="Tekrar tara" onPress={() => setScanned(false)} />}
  </View>;
}

const styles = StyleSheet.create({ wrapper: { flex: 1, backgroundColor: colors.background }, camera: { flex: 1 }, guide: { position: 'absolute', left: 20, right: 20, top: '45%', padding: 16, borderWidth: 2, borderColor: '#fff', alignItems: 'center' }, center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, gap: 16, backgroundColor: colors.background }, text: { color: '#fff', textAlign: 'center' } });