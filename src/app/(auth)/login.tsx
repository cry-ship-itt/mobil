import { useState } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, Alert } from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import { PrimaryButton } from '../../components/PrimaryButton';
import { colors, spacing, radius } from '../../constants/theme';
import { UserRole } from '../../types';

export default function LoginScreen() {
  const [inviteCode, setInviteCode] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>('amiri');
  const { login, isLoading } = useAuthStore();

  const handleLogin = async () => {
    if (!inviteCode.trim() || inviteCode.trim().length < 4) {
      Alert.alert('Hata', 'Davet kodunu girin (en az 4 karakter).');
      return;
    }
    if (!name.trim()) {
      Alert.alert('Hata', 'Adınızı girin.');
      return;
    }

    try {
      await login(inviteCode.trim().toUpperCase(), name.trim(), role);
      router.replace(role === 'amiri' ? '/(amiri)' : '/(bakimci)');
    } catch (error) {
      Alert.alert('Hata', 'Giriş başarısız oldu.');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Arıza Takip Sistemi</Text>
        <Text style={styles.subtitle}>Davet kodunuzla giriş yapın</Text>
      </View>

      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Adınız</Text>
          <TextInput
            style={styles.input}
            placeholder="Ad ve Soyad"
            value={name}
            onChangeText={setName}
            editable={!isLoading}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Davet Kodu</Text>
          <TextInput
            value={inviteCode}
            onChangeText={setInviteCode}
            placeholder="Örn: ABC123"
            autoCapitalize="characters"
            style={styles.input}
            editable={!isLoading}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Rolünüz</Text>
          <View style={styles.roleRow}>
            <RoleButton
              label="Vardiya Amiri"
              active={role === 'amiri'}
              onPress={() => setRole('amiri')}
            />
            <RoleButton
              label="Bakımcı"
              active={role === 'bakimci'}
              onPress={() => setRole('bakimci')}
            />
          </View>
        </View>

        <PrimaryButton
          label={isLoading ? 'Yükleniyor...' : 'Giriş Yap'}
          onPress={handleLogin}
          disabled={isLoading}
        />

        <View style={styles.footer}>
          <Text style={styles.footerText}>İşletme sahibi misiniz? </Text>
          <Text
            style={styles.link}
            onPress={() => router.push('/(auth)/register')}
          >
            Kuruluş Oluştur
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

function RoleButton({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Text
      onPress={onPress}
      style={[
        styles.roleButton,
        active && styles.roleButtonActive,
      ]}
    >
      {label}
    </Text>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    paddingTop: spacing.xl,
  },
  header: {
    marginBottom: spacing.xl,
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
  roleRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  roleButton: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    backgroundColor: colors.card,
  },
  roleButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    color: '#fff',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.lg,
  },
  footerText: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  link: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
});