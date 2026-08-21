import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { useAuthStore, AuthState } from '../../store/authStore';
import { LogoutHeader } from '../../components/LogoutHeader';
import { colors, spacing, radius } from '../../constants/theme';

export default function AmiriDashboard() {
  const user = useAuthStore((s: AuthState) => s.user)!;

  return (
    <View style={styles.root}>
      <LogoutHeader userName={user.name} subtitle="Vardiya Amiri" />
      <View style={styles.container}>
        <Text style={styles.title}>Ne yapmak istersiniz?</Text>

        {/* Makine Tanıt */}
        <TouchableOpacity
          style={styles.card}
          onPress={() => router.push('/(amiri)/register-machine')}
        >
          <View style={[styles.cardIcon, { backgroundColor: '#3b82f6' }]}>
            <Text style={styles.cardIconText}>⚙️</Text>
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>Makine Tanıt</Text>
            <Text style={styles.cardDesc}>Sisteme yeni makine ekleyin ve QR kod oluşturun</Text>
          </View>
          <Text style={styles.cardArrow}>›</Text>
        </TouchableOpacity>

        {/* Arıza Bildir */}
        <TouchableOpacity
          style={styles.card}
          onPress={() => router.push('/(amiri)/report-ticket')}
        >
          <View style={[styles.cardIcon, { backgroundColor: '#ef4444' }]}>
            <Text style={styles.cardIconText}>🔧</Text>
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>Arıza Bildir</Text>
            <Text style={styles.cardDesc}>Makine arızası oluşturun ve bakımcıya bildir</Text>
          </View>
          <Text style={styles.cardArrow}>›</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}


const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    padding: spacing.lg,
    paddingTop: spacing.xl,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.xl,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  cardIcon: {
    width: 60,
    height: 60,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.lg,
  },
  cardIconText: {
    fontSize: 28,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  cardDesc: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  cardArrow: {
    fontSize: 28,
    color: colors.primary,
    fontWeight: '300',
  },
});